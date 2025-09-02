const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const simpleGit = require('simple-git');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Git
const git = simpleGit('/app/website');

// Set Git configuration
async function configureGit() {
    try {
        const { execSync } = require('child_process');
        
        // Configure Git globally in the container
        execSync('git config --global user.name "atmcdon"');
        execSync('git config --global user.email "atmcdon@hotmail.com"');
        
        // Also configure locally in the repo
        execSync('git config user.name "atmcdon"', { cwd: '/app/website' });
        execSync('git config user.email "atmcdon@hotmail.com"', { cwd: '/app/website' });
        
        console.log('Git configured successfully');
        
        // Test git config
        const userName = execSync('git config user.name', { cwd: '/app/website' }).toString().trim();
        const userEmail = execSync('git config user.email', { cwd: '/app/website' }).toString().trim();
        console.log(`Git user: ${userName} <${userEmail}>`);
        
    } catch (error) {
        console.error('Error configuring Git:', error);
    }
}

// Configure Git on startup
configureGit();

// Setup SSH agent
async function setupSSH() {
    try {
        const { execSync } = require('child_process');
        
        // Start SSH agent and add key if it exists
        if (require('fs').existsSync('/root/.ssh/github')) {
            execSync('chmod 600 /root/.ssh/github');
            // Set SSH command to use specific key
            execSync('export GIT_SSH_COMMAND="ssh -i /root/.ssh/github -o IdentitiesOnly=yes"');
            console.log('SSH key configured successfully');
        } else {
            console.log('No SSH key found - auto-push will require manual setup');
        }
    } catch (error) {
        console.log('SSH setup optional:', error.message);
    }
}

setupSSH();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = '/app/website/blog-images';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// API Routes

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get current blog posts
app.get('/api/posts', async (req, res) => {
  try {
    const postsFile = '/app/website/blog-posts.json';
    if (await fs.pathExists(postsFile)) {
      const posts = await fs.readJson(postsFile);
      res.json(posts);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading posts:', error);
    res.status(500).json({ error: 'Failed to read posts' });
  }
});

// Upload image
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imagePath = `blog-images/${req.file.filename}`;
    res.json({ 
      success: true, 
      imagePath: imagePath,
      filename: req.file.filename 
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Save draft
app.post('/api/save-draft', async (req, res) => {
  try {
    const { draftName, draftData } = req.body;
    const draftsDir = '/app/website/Blog Posting/DRAFTS';
    await fs.ensureDir(draftsDir);
    
    const filename = `${draftName.replace(/[^a-z0-9]/gi, '_')}_draft.json`;
    const filepath = path.join(draftsDir, filename);
    
    await fs.writeJson(filepath, draftData, { spaces: 2 });
    
    res.json({ success: true, filename: filename });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

// Get drafts list
app.get('/api/drafts', async (req, res) => {
  try {
    const draftsDir = '/app/website/Blog Posting/DRAFTS';
    if (!(await fs.pathExists(draftsDir))) {
      return res.json([]);
    }
    
    const files = await fs.readdir(draftsDir);
    const drafts = [];
    
    for (const file of files) {
      if (file.endsWith('_draft.json')) {
        const filepath = path.join(draftsDir, file);
        const stats = await fs.stat(filepath);
        const content = await fs.readJson(filepath);
        
        drafts.push({
          filename: file,
          name: content.draftName || file.replace('_draft.json', ''),
          saved: content.saved || stats.mtime.toISOString(),
          data: content
        });
      }
    }
    
    res.json(drafts.sort((a, b) => new Date(b.saved) - new Date(a.saved)));
  } catch (error) {
    console.error('Error reading drafts:', error);
    res.status(500).json({ error: 'Failed to read drafts' });
  }
});

// Create and publish blog post
app.post('/api/publish-post', async (req, res) => {
  try {
    const { autoPush, ...newPost } = req.body;
    
    // Read existing posts
    const postsFile = '/app/website/blog-posts.json';
    let posts = [];
    
    if (await fs.pathExists(postsFile)) {
      posts = await fs.readJson(postsFile);
    }
    
    // Add new post
    posts.push(newPost);
    
    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Write back to file
    await fs.writeJson(postsFile, posts, { spaces: 2 });
    
    // Use execSync for all Git operations to ensure proper configuration
    const { execSync } = require('child_process');
    const gitOptions = { cwd: '/app/website', stdio: 'inherit' };
    
    try {
      // Configure Git
      execSync('git config user.name "atmcdon"', { cwd: '/app/website' });
      execSync('git config user.email "atmcdon@hotmail.com"', { cwd: '/app/website' });
      
      // Add files
      execSync(`git add "${postsFile}"`, gitOptions);
      
      // Add any new images
      const blogImagesDir = '/app/website/blog-images';
      if (await fs.pathExists(blogImagesDir)) {
        execSync('git add blog-images/', gitOptions);
      }
      
      // Commit
      const commitMessage = `Add new blog post: ${newPost.title}`;
      
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, gitOptions);
      
      // Push only if autoPush is enabled
      if (autoPush) {
        // Ensure remote is SSH for container access
        try {
          execSync('git remote set-url origin git@github.com:atmcdon/Personal-Website.git', gitOptions);
        } catch (remoteError) {
          console.log('Remote URL already set or error:', remoteError.message);
        }
        execSync('git push origin master', {
          ...gitOptions,
          env: { 
            ...process.env, 
            GIT_SSH_COMMAND: 'ssh -i /root/.ssh/github -o IdentitiesOnly=yes' 
          }
        });
      }
      
    } catch (gitError) {
      throw new Error(`Git operation failed: ${gitError.message}`);
    }
    
    const message = autoPush ? 
      'Blog post published and pushed to GitHub!' : 
      'Blog post published locally! Push manually when ready.';
      
    res.json({ 
      success: true, 
      message: message,
      postId: newPost.id,
      pushed: autoPush
    });
    
  } catch (error) {
    console.error('Error publishing post:', error);
    res.status(500).json({ error: `Failed to publish post: ${error.message}` });
  }
});

// Delete draft
app.delete('/api/drafts/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join('/app/website/Blog Posting/DRAFTS', filename);
    
    if (await fs.pathExists(filepath)) {
      await fs.unlink(filepath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Draft not found' });
    }
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Blog Creator Server running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});