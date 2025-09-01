let blogPosts = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Load blog posts data
    await loadBlogPosts();
    
    // Initialize timeline and categories
    initializeTimeline();
    initializeCategories();
    
    // Initialize typing effect
    initializeTypingEffect();
    
    // Check if we should show a specific post from URL hash
    const urlHash = window.location.hash;
    if (urlHash && urlHash.startsWith('#post-')) {
        const postId = parseInt(urlHash.replace('#post-', ''));
        showPost(postId);
    } else {
        showBlogList();
    }
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.postId) {
            showPost(event.state.postId);
        } else {
            showBlogList();
        }
    });
    
});

async function loadBlogPosts() {
    try {
        const response = await fetch('blog-posts.json');
        blogPosts = await response.json();
        // Sort posts by date (newest first)
        blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('Error loading blog posts:', error);
        blogPosts = [];
    }
}

function showBlogList() {
    const blogView = document.getElementById('blog-view');
    const postView = document.getElementById('post-view');
    const postsContainer = document.getElementById('blog-posts-container');
    
    // Show blog list, hide post view
    blogView.style.display = 'block';
    postView.style.display = 'none';
    
    // Clear timeline active state
    updateTimelineActive(null);
    
    // Update URL
    window.history.pushState(null, 'Blog | Andrew McDonald', 'blog.html');
    document.title = 'Blog | Andrew McDonald';
    
    // Clear container
    postsContainer.innerHTML = '';
    
    if (blogPosts.length === 0) {
        postsContainer.innerHTML = '<div class="no-posts"><p>No blog posts available yet. Check back soon!</p></div>';
        return;
    }
    
    // Use the filtered rendering function
    renderFilteredPosts();
}

function showPost(postId) {
    const post = blogPosts.find(p => p.id === postId);
    if (!post) {
        console.error('Post not found:', postId);
        showBlogList();
        return;
    }
    
    const blogView = document.getElementById('blog-view');
    const postView = document.getElementById('post-view');
    const postContent = document.getElementById('post-content');
    
    // Hide blog list, show post view
    blogView.style.display = 'none';
    postView.style.display = 'block';
    
    // Update timeline active state
    updateTimelineActive(postId);
    
    // Update URL and browser history
    const postUrl = `blog.html#post-${postId}`;
    window.history.pushState({postId: postId}, post.title, postUrl);
    document.title = `${post.title} | Andrew McDonald`;
    
    // Render post content
    const tagsHtml = post.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    // Check if featured image exists
    const featuredImageHtml = post.featured_image ? 
        `<img src="${post.featured_image}" alt="${post.featured_image_alt || post.title}" class="featured-image" onerror="this.style.display='none'">` : '';
    
    postContent.innerHTML = `
        <div class="blog-post-full">
            ${featuredImageHtml}
            <h1>${post.title}</h1>
            <div class="blog-post-meta">
                <span>By ${post.author}</span> • <span>${formatDate(post.date)}</span>
                <div class="blog-post-tags" style="margin-top: 10px;">${tagsHtml}</div>
            </div>
            <div class="blog-post-content">${post.content}</div>
        </div>
    `;
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function initializeTimeline() {
    const timelineContent = document.getElementById('timeline-content');
    if (!timelineContent) return;
    
    if (blogPosts.length === 0) {
        timelineContent.innerHTML = '<div class="timeline-loading">No posts available</div>';
        return;
    }
    
    // Create timeline items
    timelineContent.innerHTML = '';
    blogPosts.forEach(post => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.setAttribute('data-post-id', post.id);
        timelineItem.onclick = () => showPost(post.id);
        
        timelineItem.innerHTML = `
            <div class="timeline-date">${formatDate(post.date)}</div>
            <div class="timeline-title">${post.title}</div>
        `;
        
        timelineContent.appendChild(timelineItem);
    });
}

function updateTimelineActive(postId) {
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        if (postId && parseInt(item.getAttribute('data-post-id')) === postId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function toggleSection(sectionName) {
    const section = document.getElementById(`${sectionName}-section`);
    const arrow = document.getElementById(`${sectionName}-arrow`);
    
    if (section) {
        section.classList.toggle('expanded');
    }
}

let currentFilter = 'all';

function initializeCategories() {
    const categoryContent = document.getElementById('category-content');
    if (!categoryContent) return;
    
    if (blogPosts.length === 0) {
        categoryContent.innerHTML = '<div class="category-loading">No categories available</div>';
        return;
    }
    
    // Extract unique tags from all posts
    const allTags = new Set();
    blogPosts.forEach(post => {
        post.tags.forEach(tag => allTags.add(tag));
    });
    
    // Create category items
    categoryContent.innerHTML = '';
    
    // Add "All Posts" option
    const allPostsItem = document.createElement('span');
    allPostsItem.className = 'category-item all-posts active';
    allPostsItem.textContent = 'All Posts';
    allPostsItem.onclick = () => filterByCategory('all');
    categoryContent.appendChild(allPostsItem);
    
    // Add individual categories
    Array.from(allTags).sort().forEach(tag => {
        const categoryItem = document.createElement('span');
        categoryItem.className = 'category-item';
        categoryItem.textContent = tag;
        categoryItem.onclick = () => filterByCategory(tag);
        categoryContent.appendChild(categoryItem);
    });
}

function filterByCategory(category) {
    currentFilter = category;
    
    // Update active category
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        if ((category === 'all' && item.classList.contains('all-posts')) || 
            item.textContent === category) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Filter and re-render blog posts
    renderFilteredPosts();
}

function renderFilteredPosts() {
    const postsContainer = document.getElementById('blog-posts-container');
    if (!postsContainer) return;
    
    let filteredPosts = blogPosts;
    if (currentFilter !== 'all') {
        filteredPosts = blogPosts.filter(post => post.tags.includes(currentFilter));
    }
    
    postsContainer.innerHTML = '';
    
    if (filteredPosts.length === 0) {
        postsContainer.innerHTML = '<div class="no-posts"><p>No posts found for this category.</p></div>';
        return;
    }
    
    // Render filtered posts
    filteredPosts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'blog-post-card';
        postCard.onclick = () => showPost(post.id);
        
        const tagsHtml = post.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        const featuredImageHtml = post.featured_image ? 
            `<img src="${post.featured_image}" alt="${post.featured_image_alt || post.title}" class="blog-post-card-image" onerror="this.style.display='none'">` : '';
        
        postCard.innerHTML = `
            ${featuredImageHtml}
            <div class="blog-post-card-content">
                <h2>${post.title}</h2>
                <div class="blog-post-meta">
                    <span>By ${post.author}</span> • <span>${formatDate(post.date)}</span>
                </div>
                <div class="blog-post-excerpt">${post.excerpt}</div>
                <a href="#" class="read-more" onclick="event.stopPropagation(); showPost(${post.id}); return false;">Read More →</a>
                <div class="blog-post-tags">${tagsHtml}</div>
            </div>
        `;
        
        postsContainer.appendChild(postCard);
    });
}

function initializeTypingEffect() {
    const subtitle = document.getElementById('typed-subtitle');
    if (!subtitle) return;
    
    const originalText = subtitle.textContent;
    const messages = [
        "Thoughts on technology, cybersecurity, and IT",
        "Exploring the world of IT security and automation",
        "From the classroom to the data center",
        "Marine veteran turned tech educator"
    ];
    
    let messageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function typeWriter() {
        const currentMessage = messages[messageIndex];
        
        if (isDeleting) {
            subtitle.textContent = currentMessage.substring(0, charIndex - 1);
            charIndex--;
        } else {
            subtitle.textContent = currentMessage.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typeSpeed = isDeleting ? 50 : 100;
        
        if (!isDeleting && charIndex === currentMessage.length) {
            typeSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            messageIndex = (messageIndex + 1) % messages.length;
            typeSpeed = 500; // Pause before starting new message
        }
        
        setTimeout(typeWriter, typeSpeed);
    }
    
    // Start typing effect after fade in animation
    setTimeout(typeWriter, 1500);
}

// Make functions available globally
window.showBlogList = showBlogList;
window.toggleSection = toggleSection;