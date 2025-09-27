// app.js - Inbit Halal Freelancing Marketplace

document.addEventListener('DOMContentLoaded', function() {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = darkModeToggle.querySelector('i');
    
    // Check for saved theme preference or respect OS preference
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-mode');
        darkModeIcon.classList.remove('fa-moon');
        darkModeIcon.classList.add('fa-sun');
    }
    
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            darkModeIcon.classList.remove('fa-moon');
            darkModeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            darkModeIcon.classList.remove('fa-sun');
            darkModeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        
        // Toggle mobile menu
        navLinks.classList.toggle('active');
        authButtons.classList.toggle('active');
        
        // Update aria attributes for accessibility
        mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
        
        // Change menu icon
        const menuIcon = mobileMenuBtn.querySelector('i');
        if (menuIcon.classList.contains('fa-bars')) {
            menuIcon.classList.remove('fa-bars');
            menuIcon.classList.add('fa-times');
        } else {
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navLinks.classList.remove('active');
                authButtons.classList.remove('active');
                mobileMenuBtn.querySelector('i').classList.remove('fa-times');
                mobileMenuBtn.querySelector('i').classList.add('fa-bars');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Search Functionality
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    const skillChips = document.querySelectorAll('.skill-chip');
    
    // Search button click handler
    searchBtn.addEventListener('click', performSearch);
    
    // Enter key handler for search input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Skill chip click handlers
    skillChips.forEach(chip => {
        chip.addEventListener('click', () => {
            searchInput.value = chip.textContent;
            performSearch();
        });
    });
    
    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            // In a real application, this would redirect to search results
            // For demo purposes, we'll show an alert
            window.location.href = `/jobs?search=${encodeURIComponent(query)}`;
        } else {
            // If search is empty, focus on the input
            searchInput.focus();
        }
    }

    // Animate Stats Counter
    function animateStats() {
        const statsSection = document.querySelector('.hero-stats');
        const statNumbers = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Animate each stat number
                    statNumbers.forEach((stat, index) => {
                        const target = parseInt(stat.textContent);
                        animateValue(stat, 0, target, 2000);
                    });
                    
                    // Stop observing after animation triggers
                    observer.disconnect();
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(statsSection);
    }
    
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const value = Math.floor(easeOutQuart * (end - start) + start);
            
            element.textContent = value + "+";
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Initialize stats animation
    animateStats();

    // Talent Card Hover Effects
    const talentCards = document.querySelectorAll('.talent-card');
    
    talentCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
            card.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '';
        });
    });

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Form Validation for Search
    searchInput.addEventListener('input', function() {
        if (this.value.length > 50) {
            this.value = this.value.substring(0, 50);
        }
    });

    // Auth Dropdown Functionality
    const authDropdowns = document.querySelectorAll('.auth-dropdown');
    
    authDropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.auth-toggle');
        
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        authDropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });

    // Prevent dropdown close when clicking inside
    document.querySelectorAll('.auth-dropdown-menu').forEach(menu => {
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Dashboard Card Interactive Effects
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    
    dashboardCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Process Flow Animation
    function animateProcessFlow() {
        const processSteps = document.querySelectorAll('.process-step');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.3 });
        
        processSteps.forEach((step, index) => {
            step.style.opacity = '0';
            step.style.transform = 'translateY(20px)';
            step.style.transition = `opacity 0.5s ease ${index * 0.2}s, transform 0.5s ease ${index * 0.2}s`;
            
            observer.observe(step);
        });
    }
    
    // Initialize process flow animation
    animateProcessFlow();

    // Testimonial Carousel (Basic Implementation)
    let currentTestimonial = 0;
    const testimonials = document.querySelectorAll('.testimonial-card');
    
    function showTestimonial(index) {
        testimonials.forEach((testimonial, i) => {
            testimonial.style.display = i === index ? 'block' : 'none';
        });
    }
    
    // Only activate carousel on mobile
    function setupTestimonialCarousel() {
        if (window.innerWidth <= 768) {
            testimonials.forEach((testimonial, i) => {
                testimonial.style.display = i === 0 ? 'block' : 'none';
            });
            
            // Add navigation arrows (you can enhance this further)
            const testimonialSection = document.querySelector('.testimonials');
            const navHTML = `
                <div class="testimonial-nav" style="text-align: center; margin-top: 2rem;">
                    <button class="btn btn-outline prev-testimonial" style="margin-right: 1rem;">
                        <i class="fas fa-chevron-left"></i> Previous
                    </button>
                    <button class="btn btn-outline next-testimonial">
                        Next <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            `;
            
            testimonialSection.insertAdjacentHTML('beforeend', navHTML);
            
            document.querySelector('.prev-testimonial').addEventListener('click', () => {
                currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
                showTestimonial(currentTestimonial);
            });
            
            document.querySelector('.next-testimonial').addEventListener('click', () => {
                currentTestimonial = (currentTestimonial + 1) % testimonials.length;
                showTestimonial(currentTestimonial);
            });
        } else {
            // Show all testimonials on desktop
            testimonials.forEach(testimonial => {
                testimonial.style.display = 'block';
            });
            
            // Remove navigation if exists
            const existingNav = document.querySelector('.testimonial-nav');
            if (existingNav) {
                existingNav.remove();
            }
        }
    }
    
    // Setup carousel on load and resize
    window.addEventListener('load', setupTestimonialCarousel);
    window.addEventListener('resize', setupTestimonialCarousel);

    // Skill Chips Interactive Effects
    skillChips.forEach(chip => {
        chip.addEventListener('mouseenter', () => {
            chip.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        chip.addEventListener('mouseleave', () => {
            chip.style.transform = 'translateY(0) scale(1)';
        });
        
        chip.addEventListener('mousedown', () => {
            chip.style.transform = 'translateY(0) scale(0.95)';
        });
        
        chip.addEventListener('mouseup', () => {
            chip.style.transform = 'translateY(-2px) scale(1.05)';
        });
    });

    // Loading Animation for Buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            // Only add loading effect to primary and secondary buttons
            if (this.classList.contains('btn-primary') || this.classList.contains('btn-secondary')) {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                this.disabled = true;
                
                // Reset after 2 seconds (simulate loading)
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 2000);
            }
        });
    });

    // Intersection Observer for Animate on Scroll
    const animatedElements = document.querySelectorAll('.step, .trust-point, .talent-card');
    
    const elementObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-stats');
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
        elementObserver.observe(element);
    });

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        // Escape key closes mobile menu and dropdowns
        if (e.key === 'Escape') {
            navLinks.classList.remove('active');
            authButtons.classList.remove('active');
            authDropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
            
            if (window.innerWidth <= 768) {
                mobileMenuBtn.querySelector('i').classList.remove('fa-times');
                mobileMenuBtn.querySelector('i').classList.add('fa-bars');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        }
        
        // Tab key navigation enhancement
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });

    // Performance Optimization: Lazy Loading for Images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Error Handling for Images
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            this.src = '/images/placeholder.jpg';
            this.alt = 'Image not available';
        });
    });

    // Console Welcome Message
    console.log(`
    🕌 Welcome to Inbit - Halal Freelancing Marketplace!
    
    %c
    ╔══════════════════════════════════════════════════╗
    ║                  INBIT MARKETPLACE               ║
    ║      Connecting Talent with Opportunity          ║
    ║            in a Shariah-Compliant Way            ║
    ╚══════════════════════════════════════════════════╝
    
    Features:
    • Halal-focused freelancing platform
    • Transparent 5% platform fee
    • Admin quality checks
    • Secure payment system
    
    Need help? Contact support@inbit.com
    `, 'color: #2563eb; font-weight: bold;');
});

// Utility function for debouncing (for performance)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Resize handler with debouncing
window.addEventListener('resize', debounce(function() {
    // Re-initialize responsive elements
    if (window.innerWidth > 768) {
        const navLinks = document.querySelector('.nav-links');
        const authButtons = document.querySelector('.auth-buttons');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        navLinks.classList.remove('active');
        authButtons.classList.remove('active');
        
        if (mobileMenuBtn) {
            mobileMenuBtn.querySelector('i').classList.remove('fa-times');
            mobileMenuBtn.querySelector('i').classList.add('fa-bars');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    }
}, 250));

// Export functions for potential module use (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { debounce, animateValue };
}