// Check if user has watched the welcome guide
    (function() {
        const watched = localStorage.getItem('certilink_welcome_watched');
        // If not watched and not on welcome page, redirect to welcome
        if (watched !== 'true' && !window.location.pathname.includes('welcome.html')) {
            window.location.href = 'welcome.html';
        }
    })();