// Fichier d'intégration des projets GitHub (projects.js)

// Configuration
const username = 'LucasV-13-github';  // Remplacez par votre nom d'utilisateur GitHub
const projectsFile = '/data/projects.json'; // Chemin vers le fichier JSON généré par GitHub Actions
const maxProjectsToShow = 9; // Nombre de projets à afficher initialement

// Charger les projets au chargement de la page
document.addEventListener('DOMContentLoaded', loadProjects);

// Charger les projets depuis le fichier JSON ou depuis l'API GitHub
async function loadProjects() {
    try {
        // Afficher un indicateur de chargement
        const projectsContainer = document.querySelector('.projects-grid');
        projectsContainer.innerHTML = '<div class="loading"><i class="fas fa-circle-notch fa-spin"></i> Chargement des projets...</div>';
        
        // Essayer d'abord de charger depuis le fichier JSON généré
        try {
            const response = await fetch(projectsFile);
            
            if (response.ok) {
                const projects = await response.json();
                handleProjects(projects);
                return;
            }
        } catch (error) {
            console.log('Fichier de projets pré-généré non disponible, passage à l\'API GitHub');
        }
        
        // Si le fichier n'existe pas ou n'est pas accessible, récupérer depuis l'API GitHub
        await fetchGitHubProjects();
        
    } catch (error) {
        console.error('Erreur lors du chargement des projets:', error);
        displayError(error.message);
    }
}

// Récupérer les projets directement depuis l'API GitHub (projets publics uniquement)
async function fetchGitHubProjects() {
    try {
        // Récupérer les dépôts publics
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=${maxProjectsToShow}`);
        
        if (!response.ok) {
            throw new Error(`Erreur GitHub API: ${response.status}`);
        }
        
        const repos = await response.json();
        
        // Récupérer les langages pour chaque dépôt
        const projectsWithLanguages = await Promise.all(repos.map(async (repo) => {
            try {
                const langResponse = await fetch(repo.languages_url);
                const languages = await langResponse.json();
                
                // Récupérer les informations README pour éventuellement trouver une image
                let readmeImageUrl = null;
                try {
                    const readmeResponse = await fetch(`https://api.github.com/repos/${username}/${repo.name}/readme`);
                    if (readmeResponse.ok) {
                        const readmeData = await readmeResponse.json();
                        // Extraire les images potentielles du README (simple heuristique)
                        const readmeContent = atob(readmeData.content);
                        const imageMatch = readmeContent.match(/!\[.*?\]\((.*?)\)/);
                        if (imageMatch && imageMatch[1]) {
                            readmeImageUrl = imageMatch[1];
                            // Convertir les URLs relatives en absolues
                            if (readmeImageUrl.startsWith('./') || !readmeImageUrl.startsWith('http')) {
                                readmeImageUrl = `https://raw.githubusercontent.com/${username}/${repo.name}/main/${readmeImageUrl.replace('./', '')}`;
                            }
                        }
                    }
                } catch (err) {
                    console.log(`Pas d'image trouvée pour ${repo.name}`);
                }
                
                // Calculer les pourcentages de langages
                const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
                const languagePercentages = {};
                Object.entries(languages).forEach(([lang, bytes]) => {
                    languagePercentages[lang] = Math.round((bytes / totalBytes) * 100);
                });
                
                // Trier les langages par pourcentage décroissant
                const sortedLanguages = Object.entries(languagePercentages)
                    .sort((a, b) => b[1] - a[1])
                    .map(([lang, percentage]) => ({ name: lang, percentage }));
                
                return {
                    id: repo.id,
                    name: repo.name,
                    displayName: repo.name.replace(/-/g, " ").replace(/_/g, " "),
                    description: repo.description || "Pas de description disponible",
                    html_url: repo.html_url,
                    homepage: repo.homepage,
                    topics: repo.topics || [],
                    private: false, // L'API publique ne retourne que les repos publics
                    languages: sortedLanguages,
                    mainLanguage: sortedLanguages.length > 0 ? sortedLanguages[0].name : null,
                    image: readmeImageUrl || "",
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    watchers: repo.watchers_count,
                    size: repo.size,
                    created_at: repo.created_at,
                    updated_at: repo.updated_at,
                    pushed_at: repo.pushed_at,
                    category: getProjectCategory(repo.topics, sortedLanguages),
                    is_fork: repo.fork,
                    default_branch: repo.default_branch
                };
            } catch (err) {
                console.error(`Erreur lors de la récupération des détails pour ${repo.name}:`, err);
                return {
                    id: repo.id,
                    name: repo.name,
                    displayName: repo.name.replace(/-/g, " ").replace(/_/g, " "),
                    description: repo.description || "Pas de description disponible",
                    html_url: repo.html_url,
                    languages: [],
                    topics: repo.topics || [],
                    category: "other"
                };
            }
        }));
        
        handleProjects(projectsWithLanguages);
        
    } catch (error) {
        console.error('Erreur lors de la récupération des projets GitHub:', error);
        displayError(error.message);
    }
}

// Traiter et afficher les projets
function handleProjects(projects) {
    // Filtrer et trier les projets
    const filteredProjects = projects
        .filter(project => !project.is_fork) // Exclure les forks
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)); // Trier par date de mise à jour
    
    // Afficher les projets
    displayProjects(filteredProjects);
    
    // Initialiser les filtres de projets
    initProjectFilters(filteredProjects);
}

// Afficher les projets dans la grille
function displayProjects(projects) {
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
                    <span class="project-stat"><i class="fas fa-code-branch"></i> ${project.forks || 0}</span>
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
            displayProjects(filteredProjects);
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

// Afficher un message d'erreur dans la grille de projets
function displayError(message) {
    const projectsContainer = document.querySelector('.projects-grid');
    projectsContainer.innerHTML = `
        <div class="error">
            <p><i class="fas fa-exclamation-triangle"></i> Impossible de charger les projets.</p>
            <p>Erreur: ${message}</p>
            <button id="retry-btn" class="retry-btn">Réessayer</button>
        </div>`;
    
    // Ajouter un bouton pour réessayer
    document.getElementById('retry-btn').addEventListener('click', loadProjects);
}

// Déterminer la catégorie d'un projet en fonction de ses topics et langages
function getProjectCategory(topics, languages) {
    const allTopics = (topics || []).map(t => t.toLowerCase());
    const mainLanguage = languages.length > 0 ? languages[0].name : null;
    
    // Web : HTML, CSS, JavaScript, TypeScript, React, Vue, Angular, etc.
    if (allTopics.some(t => ["web", "website", "frontend", "html", "css", "javascript"].includes(t)) || 
        ["HTML", "CSS", "JavaScript", "TypeScript"].includes(mainLanguage)) {
        return "web";
    }
    
    // Applications : Android, iOS, Flutter, React Native, Electron, etc.
    if (allTopics.some(t => ["app", "application", "android", "ios", "mobile"].includes(t))) {
        return "app";
    }
    
    // Cybersécurité : security, pentest, hacking, crypto, etc.
    if (allTopics.some(t => ["cyber", "security", "pentest", "hacking", "encryption"].includes(t))) {
        return "cyber";
    }
    
    // Électronique : arduino, raspberry pi, iot, robot, etc.
    if (allTopics.some(t => ["electronic", "hardware", "arduino", "raspberry", "iot", "robot"].includes(t))) {
        return "electronics";
    }
    
    // Par défaut, utiliser la catégorie "other"
    return "other";
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
