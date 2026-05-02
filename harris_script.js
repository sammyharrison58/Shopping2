document.addEventListener('DOMContentLoaded', () => {

    // Scroll Reveal Animation
    const reveals = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 150;

        reveals.forEach((reveal) => {
            const elementTop = reveal.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');
            } else {
                reveal.classList.remove('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    // Trigger once on load
    revealOnScroll();

    // Tilt Effect for Service Cards (Subtle 3D)
    const cards = document.querySelectorAll('.service-card, .team-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5; // Max rotation deg
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });

    // Hero Background Slider Logic
    const initHeroSlider = () => {
        const sliderItems = document.querySelectorAll('.slider-item');
        if (sliderItems.length === 0) return;

        let currentIndex = 0;
        const intervalTime = 5000; // 5 seconds

        const nextSlide = () => {
            sliderItems[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % sliderItems.length;
            sliderItems[currentIndex].classList.add('active');
        };

        setInterval(nextSlide, intervalTime);
    };

    initHeroSlider();

    // Hamburger Menu Logic
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when a link is clicked
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
    // AJAX Form Submission
    const contactForm = document.getElementById('contact-form');
    const status = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerText = 'Sending...';

            try {
                // Using FormData directly is more reliable for FormSubmit than JSON
                const response = await fetch(e.target.action, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json'
                    },
                    body: formData
                });

                if (response.ok) {
                    status.innerHTML = "Thank you! Your message has been sent successfully. ✨";
                    status.style.color = "var(--accent-color)";
                    contactForm.reset();
                } else {
                    // Try to parse error message
                    let errorMessage = "Oops! There was a problem submitting your form.";
                    try {
                        const errorData = await response.json();
                        // Handle the specific "Correlation failed" message or other server errors
                        errorMessage = errorData.message || errorMessage;
                        if (errorMessage.includes("Correlation")) {
                            errorMessage = "Security check failed. Please refresh the page and try again.";
                        }
                    } catch (e) {
                        console.error('Non-JSON error response:', e);
                        if (response.status === 404) errorMessage = "Form submission endpoint not found.";
                        if (response.status === 403) errorMessage = "Please ensure your email is verified with FormSubmit.";
                    }
                    status.innerHTML = errorMessage;
                    status.style.color = "#ff4d4d";
                }
            } catch (error) {
                console.error('Fetch error:', error);
                status.innerHTML = "Connection failed. If this persists, please email us directly.";
                status.style.color = "#ff4d4d";
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Send Message';
            }
        });
    }
});
