// Fichier: projects.js

// Configuration
const projectsFile = '/data/projects.json'; // Chemin vers le fichier JSON généré
const maxProjectsToShow = 9; // Nombre de projets à afficher initialement

// Charger les projets depuis le fichier JSON
async function loadProjects() {
    try {
        // Afficher un indicateur de chargement
        const projectsContainer = document.querySelector('.projects-grid');
        projectsContainer.innerHTML = '<div class="loading"><i class="fas fa-circle-notch fa-spin"></i> Chargement des projets...</div>';
        
        // Récupérer le fichier JSON
        const response = await fetch(projectsFile);
        
        if (!response.ok) {
            throw new Error(`Erreur de chargement des projets: ${response.status}`);
        }
        
        let projects = await response.json();
        
        // Filtrer et trier les projets si nécessaire
        projects = projects
            .filter(project => !project.is_fork) // Exclure les forks
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)); // Trier par date de mise à jour
        
        // Limiter le nombre de projets affichés
        const displayProjects = projects.slice(0, maxProjectsToShow);
        
        // Afficher les projets
        displayProjectsInGrid(displayProjects);
        
        // Initialiser les filtres
        initProjectFilters(projects);
    } catch (error) {
        console.error('Erreur lors du chargement des projets:', error);
        const projectsContainer = document.querySelector('.projects-grid');
        projectsContainer.innerHTML = `
            <div class="error">
                <p><i class="fas fa-exclamation-triangle"></i> Impossible de charger les projets.</p>
                <p>Erreur: ${error.message}</p>
                <button id="retry-btn" class="retry-btn">Réessayer</button>
            </div>`;
        
        // Ajouter un bouton pour réessayer
        document.getElementById('retry-btn').addEventListener('click', loadProjects);
    }
}

// Afficher les projets dans la grille
function displayProjectsInGrid(projects) {
    const projectsContainer = document.querySelector('.projects-grid');
    projectsContainer.innerHTML = ''; // Effacer le contenu précédent
    
    if (projects.length === 0) {
        projectsContainer.innerHTML = '<div class="no-projects">Aucun projet correspondant aux critères.</div>';
        return;
    }
    
    projects.forEach((project, index) => {
        // Créer la carte de projet
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.setAttribute('data-category', project.category);
        projectCard.setAttribute('data-aos', 'fade-up');
        projectCard.setAttribute('data-aos-delay', `${index * 50}`);
        
        // Déterminer la couleur du badge de langage principal
        const langColor = getLanguageColor(project.mainLanguage);
        
        // Construire le HTML de la carte
        projectCard.innerHTML = `
            <div class="project-img-container">
                ${project.image ? `<img src="${project.image}" alt="${project.displayName}" class="project-img" onerror="this.src='/api/placeholder/800/400'">` : 
                `<div class="project-img-placeholder" style="background-color: ${langColor}20">
                    <i class="fas fa-code" style="color: ${langColor}"></i>
                </div>`}
                ${project.private ? '<span class="project-badge private"><i class="fas fa-lock"></i> Privé</span>' : ''}
            </div>
            <div class="project-content">
                <h3 class="project-title">${project.displayName}</h3>
                <p class="project-desc">${project.description}</p>
                <div class="project-techs">
                    ${project.languages.slice(0, 4).map(lang => 
                        `<span class="project-tech" style="background-color: ${getLanguageColor(lang.name)}20; color: ${getLanguageColor(lang.name)}">
                            ${lang.name} ${lang.percentage ? `<small>${lang.percentage}%</small>` : ''}
                        </span>`
                    ).join('')}
                    ${project.languages.length > 4 ? `<span class="project-tech more">+${project.languages.length - 4}</span>` : ''}
                </div>
                <div class="project-topics">
                    ${project.topics.slice(0, 3).map(topic => 
                        `<span class="project-topic">#${topic}</span>`
                    ).join('')}
                </div>
                <div class="project-stats">
                    <span class="project-stat"><i class="fas fa-star"></i> ${project.stars}</span>
                    <span class="project-stat"><i class="fas fa-code-branch"></i> ${project.forks}</span>
                    <span class="project-stat"><i class="fas fa-history"></i> ${formatDate(project.updated_at)}</span>
                </div>
                <div class="project-links">
                    <a href="${project.html_url}" class="project-link" target="_blank">
                        <i class="fab fa-github"></i>
                        Code source
                    </a>
                    ${project.homepage ? `<a href="${project.homepage}" class="project-link" target="_blank">
                        <i class="fas fa-external-link-alt"></i>
                        Demo
                    </a>` : ''}
                </div>
            </div>
        `;
        
        projectsContainer.appendChild(projectCard);
    });
    
    // Initialiser les animations
    animateProjectCards();
}

// Fonction pour initialiser les filtres de projets
function initProjectFilters(allProjects) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Mettre à jour les compteurs sur les boutons de filtre
    updateFilterCounts(allProjects);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Retirer la classe active de tous les boutons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            // Filtrer les projets
            let filteredProjects = allProjects;
            if (filter !== 'all') {
                filteredProjects = allProjects.filter(project => project.category === filter);
            }
            
            // Afficher les projets filtrés
            displayProjectsInGrid(filteredProjects.slice(0, maxProjectsToShow));
        });
    });
}

// Mettre à jour les compteurs sur les boutons de filtre
function updateFilterCounts(projects) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        const filter = btn.getAttribute('data-filter');
        let count = projects.length;
        
        if (filter !== 'all') {
            count = projects.filter(project => project.category === filter).length;
        }
        
        // Ajouter ou mettre à jour le badge de compteur
        let countBadge = btn.querySelector('.count-badge');
        if (!countBadge) {
            countBadge = document.createElement('span');
            countBadge.className = 'count-badge';
            btn.appendChild(countBadge);
        }
        
        countBadge.textContent = count;
    });
}

// Animer les cartes de projet
function animateProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');
    
    // Si AOS est disponible, rafraîchir
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
    
    // Ajouter la classe 'show' avec un délai
    projectCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('show');
        }, index * 100);
    });
}

// Formater une date pour l'affichage
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
        return "Aujourd'hui";
    } else if (diffDays === 1) {
        return "Hier";
    } else if (diffDays < 30) {
        return `Il y a ${diffDays} jours`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `Il y a ${months} mois`;
    } else {
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
    }
}

// Obtenir une couleur pour un langage de programmation
function getLanguageColor(language) {
    const colors = {
        JavaScript: '#f1e05a',
        TypeScript: '#2b7489',
        HTML: '#e34c26',
        CSS: '#563d7c',
        Python: '#3572A5',
        Java: '#b07219',
        C: '#555555',
        'C++': '#f34b7d',
        'C#': '#178600',
        PHP: '#4F5D95',
        Ruby: '#701516',
        Go: '#00ADD8',
        Swift: '#ffac45',
        Kotlin: '#F18E33',
        Rust: '#dea584'
    };
    
    return colors[language] || '#6c757d';
}

// Charger les projets au chargement de la page
document.addEventListener('DOMContentLoaded', loadProjects);
