document.addEventListener('DOMContentLoaded', () => {
    // Project item expansion
    const projectItems = document.querySelectorAll('.project-item');
    projectItems.forEach(item => {
        item.addEventListener('click', (event) => {
            if (event.target.closest('.project-expanded-content a')) {
                return;
            }
            item.classList.toggle('expanded');
        });
    });

    // Mobile navigation toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNavList = document.querySelector('#main-nav-list');

    if (menuToggle && mainNavList) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mainNavList.classList.toggle('nav-active');
            const isExpanded = mainNavList.classList.contains('nav-active');
            menuToggle.setAttribute('aria-expanded', isExpanded);
        });

        mainNavList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (mainNavList.classList.contains('nav-active')) {
                    menuToggle.classList.remove('active');
                    mainNavList.classList.remove('nav-active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    // Contact Form Validation
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            let isValid = true;
            let errorMessages = [];

            this.querySelectorAll('.error-message').forEach(el => el.remove());

            const nameField = this.querySelector('#name');
            const emailField = this.querySelector('#email');
            const messageField = this.querySelector('#message');

            if (!nameField.value.trim()) {
                isValid = false;
                errorMessages.push("Name is required.");
                displayError(nameField, "Name is required.");
            } else {
                 nameField.value = nameField.value.trim();
            }

            if (!emailField.value.trim()) {
                isValid = false;
                errorMessages.push("Email is required.");
                displayError(emailField, "Email is required.");
            } else if (!isValidEmail(emailField.value.trim())) {
                isValid = false;
                errorMessages.push("Please enter a valid email address.");
                displayError(emailField, "Please enter a valid email address.");
            }
            
            if (!messageField.value.trim()) {
                isValid = false;
                errorMessages.push("Message is required.");
                displayError(messageField, "Message is required.");
            } else {
                 messageField.value = messageField.value.trim();
            }
            
            const subjectField = this.querySelector('#subject');
            if (subjectField.value) subjectField.value = subjectField.value.trim();

            if (!isValid) {
                event.preventDefault(); 
            } else {
                alert("Your email client will now open to send the message. Thank you!");
            }
        });
    }

    // Skill bubble click toggle
    const skillItems = document.querySelectorAll('.skills-list li');
    skillItems.forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('skill-open');
            // After toggling one, update the Expand/Collapse All button text
            updateToggleSkillsButtonText(); 
        });
    });

    // Toggle All Skills Button
    const toggleSkillsBtn = document.querySelector('#toggle-skills-btn');
    if (toggleSkillsBtn) {
        toggleSkillsBtn.addEventListener('click', () => {
            // Check if *any* skill is currently closed (doesn't have skill-open)
            const isAnyClosed = Array.from(skillItems).some(item => !item.classList.contains('skill-open'));
            
            if (isAnyClosed) {
                // If any are closed, open all
                skillItems.forEach(item => item.classList.add('skill-open'));
                toggleSkillsBtn.textContent = 'Collapse All';
            } else {
                // If all are open, close all
                skillItems.forEach(item => item.classList.remove('skill-open'));
                toggleSkillsBtn.textContent = 'Expand All';
            }
        });
    }

    // Function to update the toggle button text based on current state
    function updateToggleSkillsButtonText() {
        if (!toggleSkillsBtn) return; // Exit if button doesn't exist
        const isAnyClosed = Array.from(skillItems).some(item => !item.classList.contains('skill-open'));
        if (isAnyClosed) {
            toggleSkillsBtn.textContent = 'Expand All';
        } else {
            toggleSkillsBtn.textContent = 'Collapse All';
        }
    }

    // Initial check for button text when page loads
    updateToggleSkillsButtonText();


    // Helper functions for form validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function displayError(fieldElement, message) {
        const existingError = fieldElement.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        const errorElement = document.createElement('p');
        errorElement.className = 'error-message';
        errorElement.style.color = 'red';
        errorElement.style.fontSize = '0.8em';
        errorElement.style.marginTop = '5px';
        errorElement.textContent = message;
        fieldElement.parentElement.appendChild(errorElement);
    }
});
