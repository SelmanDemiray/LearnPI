// DOM Elements
const modal = document.getElementById('projectModal');
const modalContent = document.getElementById('modal-content-container');
const modalTitle = document.getElementById('modal-title');
const closeBtn = document.getElementsByClassName('close-btn')[0];
const projectButtons = document.querySelectorAll('.project-btn');
const projectCards = document.querySelectorAll('.project-card');
const themeToggle = document.getElementById('theme-toggle');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('project-search');
const backToTop = document.querySelector('.back-to-top');

// Theme management
const ThemeManager = {
    init() {
        // Check for saved theme preference or use preference from OS
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const currentTheme = localStorage.getItem('theme');

        // Apply the saved theme or OS preference
        if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
            document.body.classList.add('dark-mode');
            this.updateThemeIcon(true);
        }

        // Theme toggle functionality
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Listen for OS theme changes
        prefersDarkScheme.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches);
            }
        });
    },
    
    toggleTheme() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        this.updateThemeIcon(isDarkMode);
    },
    
    setTheme(isDark) {
        document.body.classList.toggle('dark-mode', isDark);
        this.updateThemeIcon(isDark);
    },
    
    updateThemeIcon(isDark) {
        if (!themeToggle) return;
        themeToggle.innerHTML = isDark 
            ? '<i class="fas fa-sun" aria-hidden="true"></i>' 
            : '<i class="fas fa-moon" aria-hidden="true"></i>';
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }
};

// Modal functionality
const ModalManager = {
    init() {
        // Event listeners for project cards
        projectCards.forEach(card => {
            card.addEventListener('click', () => this.openModal(card.getAttribute('data-project')));
            // Keyboard accessibility
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openModal(card.getAttribute('data-project'));
                }
            });
        });

        // Event listeners for project buttons
        projectButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const projectId = button.parentElement.getAttribute('data-project');
                this.openModal(projectId);
            });
        });

        // Close modal events
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.closeModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal && modal.classList.contains('show')) {
                this.closeModal();
            }
        });
    },
    
    openModal(projectId) {
        if (!modal || !modalContent) return;
        
        // Get the project details
        const projectDetails = document.getElementById(`${projectId}-details`);
        
        if (projectDetails) {
            // Clone the content to avoid moving the original
            const content = projectDetails.cloneNode(true);
            
            // Update ARIA attributes
            modal.setAttribute('aria-hidden', 'false');
            
            // Set the modal title for accessibility
            if (modalTitle) {
                const projectTitle = content.querySelector('h2')?.textContent || '';
                modalTitle.textContent = projectTitle;
            }
            
            // Clear previous content and add new content
            modalContent.innerHTML = '';
            modalContent.appendChild(content);
            
            // Display the content
            content.style.display = 'block';
            
            // Show modal with animation
            modal.style.display = 'block';
            
            // Focus the modal for accessibility
            setTimeout(() => {
                modal.classList.add('show');
                modalContent.focus();
            }, 10);
            
            // Set project cards aria-pressed state
            projectCards.forEach(card => {
                const isSelected = card.getAttribute('data-project') === projectId;
                card.setAttribute('aria-pressed', isSelected);
            });
            
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeModal() {
        if (!modal) return;
        
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        
        // Reset project cards aria-pressed state
        projectCards.forEach(card => card.setAttribute('aria-pressed', 'false'));
        
        // Allow scrolling again
        document.body.style.overflow = '';
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
};

// Project filtering and searching
const ProjectManager = {
    init() {
        this.initFilters();
        this.initSearch();
    },
    
    initFilters() {
        if (filterButtons.length > 0) {
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Update ARIA attributes
                    filterButtons.forEach(btn => {
                        btn.classList.remove('active');
                        btn.setAttribute('aria-selected', 'false');
                    });
                    
                    button.classList.add('active');
                    button.setAttribute('aria-selected', 'true');
                    
                    const filter = button.getAttribute('data-filter');
                    this.filterProjects(filter);
                });
                
                // Keyboard navigation for filter tabs
                button.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const direction = e.key === 'ArrowRight' ? 1 : -1;
                        const buttons = Array.from(filterButtons);
                        const currentIndex = buttons.indexOf(button);
                        const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
                        buttons[nextIndex].focus();
                    }
                });
            });
        }
    },
    
    filterProjects(filter) {
        projectCards.forEach(card => {
            const tags = card.getAttribute('data-tags');
            const isVisible = filter === 'all' || tags.includes(filter);
            card.classList.toggle('hidden', !isVisible);
            card.setAttribute('aria-hidden', !isVisible);
        });
        
        // Announce filter change for screen readers
        this.announceForScreenReader(`Filtered to show ${filter} projects`);
    },
    
    initSearch() {
        if (!searchInput) return;
        
        // Debounce search for better performance
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.searchProjects(searchInput.value), 300);
        });
        
        // Clear search with Escape key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                this.searchProjects('');
            }
        });
    },
    
    searchProjects(searchTerm) {
        searchTerm = searchTerm.toLowerCase().trim();
        
        let matchCount = 0;
        projectCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            const tags = card.getAttribute('data-tags').toLowerCase();
            
            const isMatch = title.includes(searchTerm) || 
                description.includes(searchTerm) || 
                tags.includes(searchTerm);
            
            card.classList.toggle('hidden', !isMatch);
            card.setAttribute('aria-hidden', !isMatch);
            
            if (isMatch) matchCount++;
        });
        
        // Announce search results for screen readers
        this.announceForScreenReader(`Found ${matchCount} matching projects`);
    },
    
    announceForScreenReader(message) {
        // Create an ARIA live region for announcements if it doesn't exist
        let announcer = document.getElementById('sr-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'sr-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.classList.add('visually-hidden');
            document.body.appendChild(announcer);
        }
        
        announcer.textContent = message;
    }
};

// Scroll functionality
const ScrollManager = {
    init() {
        window.addEventListener('scroll', this.handleScroll);
        
        if (backToTop) {
            backToTop.addEventListener('click', this.scrollToTop);
            // Keyboard support
            backToTop.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.scrollToTop();
                }
            });
        }
        
        // Smooth scrolling for anchor links
        this.initSmoothScrolling();
    },
    
    handleScroll() {
        if (!backToTop) return;
        
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
            backToTop.setAttribute('aria-hidden', 'false');
        } else {
            backToTop.classList.remove('visible');
            backToTop.setAttribute('aria-hidden', 'true');
        }
    },
    
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    },
    
    initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    // Set focus to the target element for accessibility
                    targetElement.setAttribute('tabindex', '-1');
                    targetElement.focus({ preventScroll: true });
                }
            });
        });
    }
};

// Initialize all managers
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    ModalManager.init();
    ProjectManager.init();
    ScrollManager.init();
    
    // Add a class for better focus visibility only when using keyboard
    document.body.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.body.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
});
