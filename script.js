const quotePlaceHolder = document.querySelector(".title");
const newQuoteButton = document.getElementById('new-quote');
let intervalId;

const URL = 'https://api.quotable.io/random';
const updateTime = 10000;

// Add loading state
const setLoading = (isLoading) => {
  quotePlaceHolder.style.opacity = isLoading ? 0.5 : 1;
};

// Debounce function for performance
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Optimize mouse tracking with debounce and requestAnimationFrame
const handleMouseMove = debounce((e) => {
  requestAnimationFrame(() => {
    const cards = document.querySelectorAll('.grid-card');
    const len = cards.length;
    
    for (let i = 0; i < len; i++) {
      const card = cards[i];
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / card.offsetWidth) * 100;
      const y = ((e.clientY - rect.top) / card.offsetHeight) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    }
  });
}, 10);

document.addEventListener('mousemove', handleMouseMove, { passive: true });

// Improved fetch with async/await and error handling
const fetchData = async () => {
  const quotePlaceHolder = document.querySelector(".title");
  
  try {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(URL, { 
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    showData(data);
  } catch (error) {
    console.error("Failed to fetch quote:", error);
    quotePlaceHolder.textContent = "Failed to load quote. Please try again later.";
  } finally {
    setLoading(false);
  }
};

const showData = (data) => {
  const randomQuote = data[0]?.content || "No quote available";
  quotePlaceHolder.textContent = randomQuote;
};

// Reset interval
const resetInterval = () => {
    clearInterval(intervalId);
    intervalId = setInterval(fetchData, updateTime);
};

// Add click handler
newQuoteButton.addEventListener('click', () => {
    fetchData();
    resetInterval();
});

// Initial fetch
fetchData();

// Initial interval
intervalId = setInterval(fetchData, updateTime);

// Clean up interval when page unloads
window.addEventListener('unload', () => clearInterval(intervalId));

// Function to create a grid card
const createQuoteCard = (quote, author) => {
    const card = document.createElement('div');
    card.className = 'grid-card';
    
    // Sanitize content
    const sanitizeHTML = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
    
    card.innerHTML = `
        <p class="quote-text">${sanitizeHTML(quote)}</p>
        <p class="quote-author">- ${sanitizeHTML(author || 'Unknown')}</p>
    `;
    
    // Optimize mousemove handler
    const handleMouseMove = debounce((e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        requestAnimationFrame(() => {
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    }, 16);
    
    card.addEventListener('mousemove', handleMouseMove);
    
    return card;
};

// Add these constants at the top of your file
const QUOTES_PER_LOAD = 6; // Number of quotes per load
const MAX_QUOTES = 24; // Maximum total quotes to load
let totalLoadedQuotes = 0;

// Update the loadMoreQuotes function
const loadMoreQuotes = async () => {
    const loadMoreBtn = document.getElementById('load-more');
    loadMoreBtn.disabled = true;
    loadMoreBtn.classList.add('loading');
    
    try {
        const response = await fetch(`${URL}?limit=${QUOTES_PER_LOAD}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        const gridContainer = document.querySelector('.grid-container');
        
        data.forEach(quote => {
            const card = createQuoteCard(quote.content, quote.author);
            gridContainer.appendChild(card);
        });
        
        totalLoadedQuotes += data.length;
        
        if (totalLoadedQuotes >= MAX_QUOTES) {
            loadMoreBtn.textContent = 'All Quotes Loaded';
            loadMoreBtn.disabled = true;
            loadMoreBtn.classList.add('disabled');
        }
    } catch (error) {
        console.error('Failed to load quotes:', error);
        loadMoreBtn.textContent = 'Error - Try Again';
    } finally {
        loadMoreBtn.classList.remove('loading');
        if (!loadMoreBtn.classList.contains('disabled')) {
            loadMoreBtn.disabled = false;
        }
    }
};

// Use Intersection Observer for lazy loading
const observeCards = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.grid-card').forEach(card => {
    observer.observe(card);
  });
};

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  loadMoreQuotes().then(observeCards);
});

// Optimize event listeners
document.getElementById('load-more').addEventListener('click', () => {
  loadMoreQuotes().then(observeCards);
}, { passive: true });

// Handle header scroll effect
const header = document.querySelector('.header');
const headerNavLinks = document.querySelectorAll('.nav-links a');

// Update active link based on scroll position
const updateActiveLink = () => {
    const fromTop = window.scrollY + 100;

    headerNavLinks.forEach(link => {
        const section = document.querySelector(link.hash);
        
        if (
            section.offsetTop <= fromTop &&
            section.offsetTop + section.offsetHeight > fromTop
        ) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
};

// Header scroll effect
const handleScroll = debounce(() => {
    handleBackToTop();
    updateActiveLink();
}, 16);

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Optimize scroll listener with throttle
let ticking = false;
document.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

// Initial check for active section
document.addEventListener('DOMContentLoaded', () => {
    handleScroll();
});

// Back to top functionality
const backToTopButton = document.getElementById('back-to-top');

const handleBackToTop = () => {
    if (window.scrollY > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
};

backToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Add scroll listener for back to top button
window.addEventListener('scroll', () => {
    handleBackToTop();
}, { passive: true });

// Mobile menu functionality
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
const menuOverlay = document.createElement('div');
menuOverlay.classList.add('menu-overlay');
document.body.appendChild(menuOverlay);

const toggleMenu = () => {
    const isOpen = mobileMenuBtn.classList.toggle('active');
    navLinks.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    document.body.style.overflow = isOpen ? 'hidden' : '';
    
    // Update aria-label and aria-expanded for accessibility
    mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
};

mobileMenuBtn.addEventListener('click', toggleMenu);
menuOverlay.addEventListener('click', toggleMenu);

// Close menu when clicking nav links
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
            toggleMenu();
        }
    });
});

// Close menu on resize if open
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
        toggleMenu();
    }
});

// Add some CSS for the disabled button state
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .load-more-btn.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: rgba(77, 127, 255, 0.1) !important;
        transform: none !important;
    }
`;
document.head.appendChild(styleSheet);

// Add error boundary
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Implement error reporting here
});
