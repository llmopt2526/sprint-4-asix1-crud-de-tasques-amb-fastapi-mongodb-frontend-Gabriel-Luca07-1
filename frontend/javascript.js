/* =========================================================================
   1. CONFIGURACIÓ INICIAL I CONNEXIÓ AMB L'HTML 
   ========================================================================= */

// Aquí defineixo la URL base del meu backend de FastAPI. 
// Totes les peticions HTTP que faci des del frontend aniran cap a aquesta adreça.
const API_URL = 'http://localhost:8000';

// El primer que faig és "capturar" els elements del meu fitxer HTML (index.html) 
// utilitzant els seus 'id'. Així puc interactuar amb ells des de JavaScript 
// (per llegir què s'ha escrit, mostrar/amagar botons, afegir les targetes, etc.).
const movieForm    = document.getElementById('movie-form');
const moviesList   = document.getElementById('movies-list');
const formTitle    = document.getElementById('form-title');
const submitBtn    = document.getElementById('submit-btn');
const cancelBtn    = document.getElementById('cancel-btn');
const movieIdInput = document.getElementById('movie-id');


/* =========================================================================
   2. LÒGICA D'ESTADÍSTIQUES (DASHBOARD)
   ========================================================================= */

// He creat aquesta funció per actualitzar els números que surten a la capçalera de la pàgina.
function updateStats(movies) {
    // Primer, compto el total de pel·lícules de la llista que em passa el backend.
    document.getElementById('stat-total').textContent = movies.length;
    
    // Després, utilitzo el mètode '.filter()' per quedar-me només amb les que tenen l'estat 'vista'.
    const vistes = movies.filter(m => m.estat === 'vista');
    document.getElementById('stat-vistes').textContent = vistes.length;
    
    // Si he vist alguna pel·lícula, en calculo la nota mitjana.
    // Ho faig sumant totes les notes amb '.reduce()' i dividint pel total de vistes.
    if (vistes.length) {
        const avg = vistes.reduce((suma, m) => suma + m.puntuacio, 0) / vistes.length;
        document.getElementById('stat-avg').textContent = avg.toFixed(1); // 'toFixed(1)' ho deixa amb un sol decimal.
    } else {
        // Si no n'he vist cap, poso un guió perquè no em doni error de dividir per zero.
        document.getElementById('stat-avg').textContent = '—';
    }
}


/* =========================================================================
   3. LÒGICA DE LES PESTANYES (FILTRES)
   ========================================================================= */

// Guardo en una variable quin filtre està actiu ara mateix. Per defecte és 'all' (Totes).
let currentFilter = 'all';

// Capturo tots els botons que fan de pestanya i els hi poso un escoltador.
document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        // Quan clico una pestanya, primer trec la classe 'active' de totes...
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        // ...i se l'afegeixo només a la que acabo de clicar (per canviar-li el color visualment).
        btn.classList.add('active');
        
        // Guardo la paraula clau del filtre (all, vista o pendent) llegint el 'data-filter' del HTML.
        currentFilter = btn.dataset.filter;
        
        // Torno a demanar les pel·lícules al servidor perquè apliqui el filtre nou.
        fetchMovies();
    });
});


/* =========================================================================
   4. ESCOLTADORS D'ESDEVENIMENTS PRINCIPALS (EVENT LISTENERS)
   ========================================================================= */

// Afegeixo un "escoltador" perquè, just quan la pàgina web hagi carregat completament, 
// s'executi la meva funció 'fetchMovies' i la llista s'ompli automàticament de dades.
document.addEventListener('DOMContentLoaded', fetchMovies);

// També preparo el meu formulari: quan faig clic al botó de submit ("Guardar" o "Actualitzar"), 
// faig que s'executi la meva funció 'handleFormSubmit'.
movieForm.addEventListener('submit', handleFormSubmit);

// I si l'usuari clica "Cancel·lar" a mitja edició, crido a 'resetForm' per netejar-ho tot.
cancelBtn.addEventListener('click', resetForm);


/* =========================================================================
   5. OPERACIÓ LLEGIR (R - READ): OBTENIR DADES AL SERVIDOR
   ========================================================================= */

// He creat aquesta funció ASÍNCRONA per demanar les pel·lícules al meu backend.
// Utilitzo 'async/await' perquè la petició a la xarxa no em bloquegi la pàgina mentre espero la resposta.
async function fetchMovies() {
    try {
        // Faig una petició GET al meu endpoint de FastAPI per obtenir totes les pel·lícules.
        const response = await fetch(`${API_URL}/pelicules/`); 
        
        // Si el meu backend em retorna un error, faig saltar una excepció invisible per l'usuari.
        if (!response.ok) throw new Error('Error al carregar les pel·lícules');
        
        // Converteixo la resposta del meu servidor a un objecte JSON manejable.
        const data = await response.json();
        let movies = data.pelicules; 
        
        // Abans de dibuixar-les, aplico la lògica del meu filtre de pestanyes.
        if (currentFilter === 'vista')   movies = movies.filter(m => m.estat === 'vista');
        if (currentFilter === 'pendent') movies = movies.filter(m => m.estat !== 'vista');

        // Actualitzo els números del dashboard passant-li TOTES les pelis (no les filtrades).
        updateStats(data.pelicules);
        
        // Finalment, li passo la llista ja filtrada a la funció que dibuixa les targetes HTML.
        renderCards(movies);
    } catch (error) {
        console.error("Error llegint dades: El servidor FastAPI podria estar apagat.", error);
    }
}


/* =========================================================================
   6. DIBUIXAR LA INTERFÍCIE (RENDER): CREAR LES TARGETES
   ========================================================================= */

// Amb aquesta funció agafo la llista de pel·lícules i construeixo les targetes visuals.
function renderCards(movies) {
    // Si la llista que m'arriba està buida (o perquè no n'hi ha cap o pel filtre), mostro un missatge maco.
    if (!movies.length) {
        moviesList.innerHTML = `
            <div class="empty">
                <p>Cap pel·lícula aquí. Afegeix-ne una!</p>
            </div>`;
        return; // Aturo la funció aquí perquè no hi ha res més a fer.
    }
  
    // Si n'hi ha, primer buido el contenidor perquè no se'm dupliquin les dades quan recarrego.
    moviesList.innerHTML = '';
  
    // Faig un bucle per recórrer cadascuna de les pel·lícules.
    movies.forEach((movie, i) => {
        // Tinc en compte que el meu backend pot exposar l'id com a 'id' o '_id'.
        const id = movie.id || movie._id;
        
        // Preparo les classes i textos de l'etiqueta de color (badge) segons el seu estat.
        const isVista = movie.estat === 'vista';
        const badgeClass = isVista ? 'badge-vista' : 'badge-pendent';
        const badgeText  = isVista ? 'Vista' : 'Pendent';

        // Creo un nou element 'div' des de JavaScript.
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        // Afegeixo un petit retard progressiu basat en la posició (i) perquè l'animació faci un efecte cascada.
        card.style.animationDelay = `${i * 0.04}s`; 
        
        // Omplo la targeta injectant-hi les dades amb 'Template Literals' (les cometes inverses).
        // Li passo l'ID com a paràmetre als botons d'Editar i Esborrar.
        card.innerHTML = `
            <div class="movie-main">
                <div class="movie-top">
                    <span class="movie-title">${movie.titol}</span>
                    <span class="movie-genre">${movie.genere}</span>
                </div>
                <div class="movie-desc">${movie.descripcio}</div>
                <div class="movie-meta">
                    <span class="badge ${badgeClass}">${badgeText}</span>
                    <span class="movie-user">${movie.usuari}</span>
                </div>
            </div>
            <div class="movie-side">
                <div class="rating">${movie.puntuacio}<span>/10</span></div>
                <div class="actions">
                    <button class="action-btn btn-edit"  onclick="editMovie('${id}')">Editar</button>
                    <button class="action-btn btn-delete" onclick="deleteMovie('${id}')">Esborrar</button>
                </div>
            </div>`;
          
        // I enganxo aquesta targeta acabada de crear a la meva llista principal.
        moviesList.appendChild(card);
    });
}


/* =========================================================================
   7. OPERACIONS CREAR I ACTUALITZAR (C & U - CREATE & UPDATE)
   ========================================================================= */

// Aquesta és la funció que s'encarrega de processar el meu formulari quan l'envio.
async function handleFormSubmit(event) {
    // Evito que la pàgina es recarregui (que és el que fan els formularis per defecte).
    event.preventDefault();

    // Recopilo totes les dades que acabo d'escriure als diferents inputs.
    const movieData = {
        titol:      document.getElementById('titol').value,
        descripcio: document.getElementById('descripcio').value,
        estat:      document.getElementById('estat').value,
        puntuacio:  parseFloat(document.getElementById('puntuacio').value), // 'parseFloat' em permet guardar notes amb decimals (ex: 8.5)
        genere:     document.getElementById('genere').value,
        usuari:     document.getElementById('usuari').value
    };

    // Llegeixo l'input ocult on guardo l'ID (si n'hi ha cap).
    const id = movieIdInput.value;

    try {
        if (id) {
            // == EDICIÓ (PUT) ==
            // Si hi ha un ID amagat al formulari, vol dir que estic editant.
            // Faig una petició PUT al meu backend, passant la ID a la URL.
            await fetch(`${API_URL}/pelicules/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(movieData) // Converteixo les meves dades a format JSON
            });
        } else {
            // == CREACIÓ (POST) ==
            // Si no hi ha ID, és una peli nova. Faig un POST directe a la meva col·lecció.
            await fetch(`${API_URL}/pelicules/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(movieData)
            });
        }
        
        // Un cop guardat, netejo el formulari i demano al backend les dades actualitzades 
        // perquè la llista mostri el canvi immediatament sense haver de recarregar la pàgina.
        resetForm();
        fetchMovies();
    } catch (error) {
        console.error("He tingut un error al desar la pel·lícula.", error);
    }
}


/* =========================================================================
   8. OPERACIÓ ESBORRAR (D - DELETE)
   ========================================================================= */

// Aquesta funció la llenço quan clico el botó "Esborrar" d'una targeta concreta.
async function deleteMovie(id) {
    // Per evitar esborrats accidentals, faig que salti un missatge de confirmació al navegador.
    if (!confirm('Segur que vols esborrar aquesta pel·lícula?')) return;

    try {
        // Envio una petició amb el mètode DELETE a l'endpoint del meu backend per destruir l'element.
        await fetch(`${API_URL}/pelicules/${id}`, { method: 'DELETE' });
        
        // Torno a carregar la llista perquè la pel·lícula esborrada ja no hi surti.
        fetchMovies(); 
    } catch (error) {
        console.error("Error a l'esborrar la pel·lícula.", error);
    }
}


/* =========================================================================
   9. FUNCIONS AUXILIARS DE LA INTERFÍCIE (PREPARAR EDICIÓ I NETEJAR)
   ========================================================================= */

// Utilitzo aquesta funció per preparar el meu formulari quan vull editar.
async function editMovie(id) {
    try {
        // Primer, faig un GET per obtenir totes les dades d'AQUESTA pel·lícula en concret des del servidor.
        const response = await fetch(`${API_URL}/pelicules/${id}`);
        const movie = await response.json();

        // Ara, poso manualment els valors recuperats dins dels camps de text del meu formulari.
        movieIdInput.value = movie.id || movie._id; // Guardo l'ID d'amagat perquè el submit sàpiga que és una edició.
        document.getElementById('titol').value      = movie.titol;
        document.getElementById('descripcio').value = movie.descripcio;
        document.getElementById('estat').value      = movie.estat;
        document.getElementById('puntuacio').value  = movie.puntuacio;
        document.getElementById('genere').value     = movie.genere;
        document.getElementById('usuari').value     = movie.usuari;

        // Canvio la interfície per fer evident que ara estem editant: canvio el títol,
        // el botó de Guardar ara diu Actualitzar, i mostro el botó de cancel·lar per si l'usuari es penedeix.
        formTitle.textContent   = 'Editar Pel·lícula';
        submitBtn.textContent   = 'Actualitzar';
        cancelBtn.style.display = 'block';
        
        // Com que el formulari pot quedar a dalt de tot de la pàgina si he fet molt scroll, 
        // faig que el navegador pugi automàticament i de forma suau per ensenyar-me'l.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error("No he pogut carregar les dades de la pel·lícula per editar-la.", error);
    }
}

// Finalment, he dissenyat aquesta funció per "reiniciar" la meva interfície de formulari.
function resetForm() {
    // Això buida de cop tots els camps de text que hi hagi escrits.
    movieForm.reset(); 
    
    // M'asseguro d'esborrar l'ID ocult (molt important perquè el pròxim cop guardi com a peli nova i no sobrescrigui res).
    movieIdInput.value = '';
    
    // Retorno els textos de la interfície al seu estat original (mode "Afegir nova").
    formTitle.textContent   = 'Afegir Pel·lícula';
    submitBtn.textContent   = 'Guardar';
    cancelBtn.style.display = 'none'; // Torno a amagar el botó de Cancel·lar.
}
