// admin-ui.js - Mobile menu and tab functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu functionality
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const mainWrapper = document.getElementById('mainWrapper');

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('mobile-open');
            mainWrapper.classList.toggle('menu-open');
            mobileMenuBtn.classList.toggle('active');
        });

        // Close menu when clicking on overlay
        mainWrapper.addEventListener('click', function(e) {
            if (e.target === mainWrapper && mainWrapper.classList.contains('menu-open')) {
                sidebar.classList.remove('mobile-open');
                mainWrapper.classList.remove('menu-open');
                mobileMenuBtn.classList.remove('active');
            }
        });

        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', () => {
                sidebar.classList.remove('mobile-open');
                mainWrapper.classList.remove('menu-open');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }

    // Tab navigation functionality
    const tabButtons = document.querySelectorAll('.admin-nav button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show corresponding tab content
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
});