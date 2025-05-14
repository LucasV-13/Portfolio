// Fichier principal JavaScript (main.js)

// Variables
const header = document.getElementById('header');
const navLinks = document.querySelectorAll('.nav-link');
const menuBtn = document.getElementById('menuBtn');
const navLinksContainer = document.getElementById('navLinks');
const contentWrapper = document.querySelector('.content-wrapper');
const scrollIndicator = document.getElementById('scroll-indicator');
const backToTop = document.getElementById('backToTop');
const timelineItems = document.querySelectorAll('.timeline-item');
const skillItems = document.querySelectorAll('.skill-item');
const languageItems = document.querySelectorAll('.language-item');
const progressBars = document.querySelectorAll('.progress');
const contactItems = document.querySelectorAll('.contact-item');
const socialLinks = document.querySelectorAll('.social-link');
const resourceHeaders = document.querySelectorAll('.resource-header');
const resourceItems = document.querySelectorAll('.resource-item');

// Fonction pour activer le lien de navigation actif
function setActiveNavLink() {
    const sections = document.querySelectorAll('section');
    const scrollPosition = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + sectionId) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// Fonction pour vérifier si un élément est dans le viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
        rect.bottom >= 0
    );
}

// Fonction pour animer les éléments au défilement
function animateOnScroll() {
    // Animation de la timeline
    timelineItems.forEach(item => {
        if (isInViewport(item)) {
            item.classList.add('show');
        }
    });
    
    // Animation des compétences
    skillItems.forEach((item, index) => {
        if (isInViewport(item)) {
            setTimeout(() => {
                item.classList.add('show');
            }, index * 100);
        }
    });
    
    // Animation des langues
    languageItems.forEach((item, index) => {
        if (isInViewport(item)) {
            item.classList.add('show');
            setTimeout(() => {
                const progressBar = item.querySelector('.progress');
                const width = progressBar.getAttribute('data-width');
                progressBar.style.width = width + '%';
            }, 300 + index * 200);
        }
    });
    
    // Animation des ressources
    resourceItems.forEach((item, index) => {
        if (isInViewport(item)) {
            setTimeout(() => {
                item.classList.add('show');
            }, index * 100);
        }
    });
    
    // Animation des contacts
    contactItems.forEach((item, index) => {
        if (isInViewport(item)) {
            setTimeout(() => {
                item.classList.add('show');
            }, index * 100);
        }
    });
    
    // Animation des réseaux sociaux
    socialLinks.forEach((link, index) => {
        if (isInViewport(link.parentElement)) {
            setTimeout(() => {
                link.classList.add('show');
            }, 500 + index * 150);
        }
    });
}

// Fonction pour gérer le défilement
function handleScroll() {
    // Header sticky avec fond translucide au défilement
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
        backToTop.classList.add('show');
    } else {
        header.classList.remove('scrolled');
        backToTop.classList.remove('show');
    }
    
    // Vérification si la section hero n'est plus entièrement visible
    const heroContainer = document.querySelector('.hero-container');
    const heroRect = heroContainer.getBoundingClientRect();
    
    if (heroRect.bottom < window.innerHeight) {
        contentWrapper.style.animationPlayState = 'running';
        // Masquer l'indicateur de défilement quand l'utilisateur a défilé
        scrollIndicator.style.opacity = '0';
        scrollIndicator.style.visibility = 'hidden';
    } else {
        // Afficher l'indicateur de défilement quand le hero est entièrement visible
        scrollIndicator.style.opacity = '1';
        scrollIndicator.style.visibility = 'visible';
    }
    
    // Activer le lien de navigation correspondant à la section actuelle
    setActiveNavLink();
    
    // Animer les éléments qui entrent dans le viewport
    animateOnScroll();
}

// Mobile menu toggle
menuBtn.addEventListener('click', function() {
    navLinksContainer.classList.toggle('show');
});

// Fermer le menu mobile en cliquant sur un lien
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        navLinksContainer.classList.remove('show');
    });
});

// Rendre l'indicateur de défilement cliquable pour défiler vers le bas
scrollIndicator.addEventListener('click', function() {
    document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
});

// Bouton Retour en haut
backToTop.addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Accordéon pour les ressources
resourceHeaders.forEach(header => {
    header.addEventListener('click', function() {
        const content = this.nextElementSibling;
        const icon = this.querySelector('.fa-chevron-down');
        
        // Toggle la classe active sur le contenu
        content.classList.toggle('active');
        
        // Rotation de l'icône
        if (content.classList.contains('active')) {
            icon.style.transform = 'rotate(180deg)';
        } else {
            icon.style.transform = 'rotate(0)';
        }
    });
});

// Écouter les événements de défilement
window.addEventListener('scroll', handleScroll);

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });
    
    // Initialiser l'état des éléments
    handleScroll();
    
    // Initialiser les barres de progression des langues
    progressBars.forEach(bar => {
        bar.style.width = '0';
    });
    
    // Ajouter une légère animation au chargement des sections
    document.querySelectorAll('[data-aos]').forEach(item => {
        item.style.opacity = '0';
        setTimeout(() => {
            item.style.opacity = '1';
        }, 300);
    });
});
