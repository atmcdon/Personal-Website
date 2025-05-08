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

            // Clear previous custom error messages if any
            this.querySelectorAll('.error-message').forEach(el => el.remove());

            const nameField = this.querySelector('#name');
            const emailField = this.querySelector('#email');
            const messageField = this.querySelector('#message');

            if (!nameField.value.trim()) {
                isValid = false;
                errorMessages.push("Name is required.");
                displayError(nameField, "Name is required.");
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
            
            // Basic message check (not empty)
            // For "sanitization" on client-side, we can trim whitespace.
            // True sanitization (e.g. against XSS) is a server-side responsibility.
            if (!messageField.value.trim()) {
                isValid = false;
                errorMessages.push("Message is required.");
                displayError(messageField, "Message is required.");
            } else {
                 // Example of simple "sanitization": trim whitespace.
                 messageField.value = messageField.value.trim();
            }
            
            // Sanitize name and subject by trimming
            if (nameField.value) nameField.value = nameField.value.trim();
            const subjectField = this.querySelector('#subject');
            if (subjectField.value) subjectField.value = subjectField.value.trim();


            if (!isValid) {
                event.preventDefault(); // Prevent form submission
                // Optionally, alert all errors or display them near fields (as done by displayError)
                // alert("Please correct the following errors:\n" + errorMessages.join("\n"));
            } else {
                // If using mailto, the browser handles it.
                // If using a service/backend, this is where you'd typically make an AJAX call.
                // For mailto, it's good practice to inform the user.
                alert("Your email client will now open to send the message. Thank you!");
            }
        });
    }

    function isValidEmail(email) {
        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function displayError(fieldElement, message) {
        // Remove existing error message for this field
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
