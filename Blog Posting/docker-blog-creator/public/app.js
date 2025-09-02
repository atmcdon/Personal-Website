let currentTags = [];
let nextPostId = 1;

// Set today's date as default
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('post-date').value = new Date().toISOString().split('T')[0];
    await loadDrafts();
    await getNextPostId();
});

// Get next available post ID
async function getNextPostId() {
    try {
        const response = await fetch('/api/posts');
        if (response.ok) {
            const posts = await response.json();
            nextPostId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;
        }
    } catch (error) {
        console.error('Error getting posts:', error);
        nextPostId = 1;
    }
}

// Handle tag input
document.getElementById('tag-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tagValue = this.value.trim();
        if (tagValue && !currentTags.includes(tagValue)) {
            currentTags.push(tagValue);
            updateTagsDisplay();
            this.value = '';
        }
    }
});

function updateTagsDisplay() {
    const container = document.getElementById('tags-container');
    container.innerHTML = currentTags.map((tag, index) => 
        `<div class="tag-item">
            ${tag}
            <span class="tag-remove" onclick="removeTag(${index})">×</span>
        </div>`
    ).join('');
}

function removeTag(index) {
    currentTags.splice(index, 1);
    updateTagsDisplay();
}

// Image upload for featured image
async function uploadFeaturedImage(input) {
    const file = input.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        showStatus('Uploading image...', 'success');
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('featured-image').value = result.imagePath;
            
            const previewDiv = document.getElementById('featured-image-preview');
            previewDiv.innerHTML = `<img src="/${result.imagePath}" alt="Preview">`;
            
            showStatus(`Image uploaded: ${result.filename}`, 'success');
        } else {
            showStatus(`Upload failed: ${result.error}`, 'error');
        }
    } catch (error) {
        showStatus(`Upload error: ${error.message}`, 'error');
    }
}

// Insert image in content
function insertImageInContent() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            showStatus('Uploading image...', 'success');
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                const altText = prompt('Enter image description:', file.name.replace(/\.[^/.]+$/, ""));
                
                const textarea = document.getElementById('post-content');
                const cursorPos = textarea.selectionStart;
                const textBefore = textarea.value.substring(0, cursorPos);
                const textAfter = textarea.value.substring(textarea.selectionEnd);
                
                const imageTemplate = `<img src='${result.imagePath}' alt='${altText || 'Blog image'}' class='content-image'>

`;
                
                textarea.value = textBefore + imageTemplate + textAfter;
                textarea.focus();
                textarea.setSelectionRange(cursorPos + imageTemplate.length, cursorPos + imageTemplate.length);
                
                showStatus(`Image uploaded and inserted: ${result.filename}`, 'success');
            } else {
                showStatus(`Upload failed: ${result.error}`, 'error');
            }
        } catch (error) {
            showStatus(`Upload error: ${error.message}`, 'error');
        }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

// Toolbar functions
function insertCode() {
    const textarea = document.getElementById('post-content');
    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);
    const textAfter = textarea.value.substring(textarea.selectionEnd);
    
    const codeTemplate = `<pre><code># Example code block
print("Hello, World!")
# Add your code here</code></pre>

`;
    
    textarea.value = textBefore + codeTemplate + textAfter;
    textarea.focus();
    textarea.setSelectionRange(cursorPos + 12, cursorPos + 12 + 20);
}

function insertHeading() {
    insertAtCursor(`<h2>Your Heading Here</h2>
<p>Add your content here...</p>

`);
}

function insertHeading3() {
    insertAtCursor(`<h3>Your Subheading</h3>
<p>Add your content here...</p>

`);
}

function insertList() {
    insertAtCursor(`<ul>
<li>First item</li>
<li>Second item</li>
<li>Third item</li>
</ul>

`);
}

function insertAtCursor(text) {
    const textarea = document.getElementById('post-content');
    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);
    const textAfter = textarea.value.substring(textarea.selectionEnd);
    
    textarea.value = textBefore + text + textAfter;
    textarea.focus();
    textarea.setSelectionRange(cursorPos + text.length, cursorPos + text.length);
}

// Draft management
async function saveDraft() {
    const draftName = document.getElementById('draft-name').value.trim();
    if (!draftName) {
        showStatus('Please enter a name for your draft', 'error');
        return;
    }
    
    const draftData = {
        title: document.getElementById('post-title').value,
        author: document.getElementById('post-author').value,
        date: document.getElementById('post-date').value,
        excerpt: document.getElementById('post-excerpt').value,
        content: document.getElementById('post-content').value,
        featured_image: document.getElementById('featured-image').value,
        featured_image_alt: document.getElementById('featured-image-alt').value,
        tags: currentTags,
        saved: new Date().toISOString(),
        draftName: draftName
    };
    
    try {
        const response = await fetch('/api/save-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ draftName, draftData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('draft-name').value = '';
            await loadDrafts();
            showStatus(`Draft "${draftName}" saved successfully!`, 'success');
        } else {
            showStatus(`Failed to save draft: ${result.error}`, 'error');
        }
    } catch (error) {
        showStatus(`Error saving draft: ${error.message}`, 'error');
    }
}

async function loadDrafts() {
    try {
        const response = await fetch('/api/drafts');
        const drafts = await response.json();
        
        const draftSelect = document.getElementById('draft-select');
        draftSelect.innerHTML = '<option value="">-- Select a draft --</option>';
        
        drafts.forEach(draft => {
            const option = document.createElement('option');
            option.value = draft.filename;
            option.textContent = `${draft.name} (${new Date(draft.saved).toLocaleDateString()})`;
            option.dataset.draftData = JSON.stringify(draft.data);
            draftSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading drafts:', error);
    }
}

function loadDraft() {
    const draftSelect = document.getElementById('draft-select');
    const selectedOption = draftSelect.options[draftSelect.selectedIndex];
    
    if (!selectedOption.dataset.draftData) return;
    
    const draftData = JSON.parse(selectedOption.dataset.draftData);
    
    document.getElementById('post-title').value = draftData.title || '';
    document.getElementById('post-author').value = draftData.author || 'Andrew McDonald';
    document.getElementById('post-date').value = draftData.date || new Date().toISOString().split('T')[0];
    document.getElementById('post-excerpt').value = draftData.excerpt || '';
    document.getElementById('post-content').value = draftData.content || '';
    document.getElementById('featured-image').value = draftData.featured_image || '';
    document.getElementById('featured-image-alt').value = draftData.featured_image_alt || '';
    currentTags = draftData.tags || [];
    updateTagsDisplay();
    
    document.getElementById('draft-name').value = draftData.draftName || '';
}

async function deleteDraft() {
    const draftSelect = document.getElementById('draft-select');
    const selectedOption = draftSelect.options[draftSelect.selectedIndex];
    
    if (!selectedOption.value) {
        showStatus('Please select a draft to delete', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete "${selectedOption.textContent}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/drafts/${selectedOption.value}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadDrafts();
            showStatus('Draft deleted successfully', 'success');
        } else {
            showStatus(`Failed to delete draft: ${result.error}`, 'error');
        }
    } catch (error) {
        showStatus(`Error deleting draft: ${error.message}`, 'error');
    }
}

// Form submission
document.getElementById('blog-post-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '🚀 Publishing...';
    document.body.classList.add('loading');
    
    try {
        const formData = {
            id: nextPostId,
            title: document.getElementById('post-title').value.trim(),
            author: document.getElementById('post-author').value.trim(),
            date: document.getElementById('post-date').value,
            featured_image: document.getElementById('featured-image').value.trim() || null,
            featured_image_alt: document.getElementById('featured-image-alt').value.trim() || null,
            excerpt: document.getElementById('post-excerpt').value.trim(),
            content: document.getElementById('post-content').value.trim(),
            tags: currentTags
        };
        
        // Validate required fields
        if (!formData.title || !formData.author || !formData.date || !formData.excerpt || !formData.content) {
            throw new Error('Please fill in all required fields');
        }
        
        if (currentTags.length === 0) {
            throw new Error('Please add at least one tag');
        }
        
        const autoPush = document.getElementById('auto-push').checked;
        
        const response = await fetch('/api/publish-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({...formData, autoPush})
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus(`🎉 ${result.message} Post ID: ${result.postId}`, 'success');
            
            // Clear form and update next ID
            document.getElementById('blog-post-form').reset();
            currentTags = [];
            updateTagsDisplay();
            document.getElementById('post-date').value = new Date().toISOString().split('T')[0];
            nextPostId++;
        } else {
            showStatus(`Failed to publish: ${result.error}`, 'error');
        }
        
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🚀 Publish Blog Post';
        document.body.classList.remove('loading');
    }
});

// Load draft on selection change
document.getElementById('draft-select').addEventListener('change', loadDraft);

function showStatus(message, type) {
    const statusDiv = document.getElementById('status-message');
    statusDiv.innerHTML = `<div class="status-${type}">${message}</div>`;
    
    if (type === 'success') {
        setTimeout(() => statusDiv.innerHTML = '', 5000);
    }
}

// Make functions global
window.removeTag = removeTag;
window.uploadFeaturedImage = uploadFeaturedImage;
window.insertCode = insertCode;
window.insertImageInContent = insertImageInContent;
window.insertHeading = insertHeading;
window.insertHeading3 = insertHeading3;
window.insertList = insertList;
window.saveDraft = saveDraft;
window.loadDraft = loadDraft;
window.deleteDraft = deleteDraft;