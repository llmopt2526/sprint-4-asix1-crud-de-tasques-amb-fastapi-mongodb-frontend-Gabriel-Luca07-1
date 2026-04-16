/* =========================================================================
   1. CONFIGURACIÓ INICIAL I CONNEXIÓ AMB L'HTML (DOM)
   ========================================================================= */

// Aquí defineixo la URL base del meu backend de FastAPI. 
// Totes les peticions HTTP que faci des del frontend aniran cap a aquesta adreça.
const API_URL = 'http://localhost:8000'; 

// El primer que faig és "capturar" els elements del meu fitxer HTML (index.html) 
// utilitzant els seus 'id'. Així puc interactuar amb ells des de JavaScript 
// (per llegir què s'ha escrit, mostrar/amagar botons, afegir files a la taula, etc.).
const movieForm = document.getElementById('movie-form');
const moviesTableBody = document.getElementById('movies-table-body');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const movieIdInput = document.getElementById('movie-id');


/* =========================================================================
   2. ESCOLTADORS D'ESDEVENIMENTS (EVENT LISTENERS)
   ========================================================================= */

// Afegeixo un "escoltador" perquè, just quan la pàgina web hagi carregat completament, 
// s'executi la meva funció 'fetchMovies' i la taula s'ompli automàticament de dades.
document.addEventListener('DOMContentLoaded', fetchMovies);

// També preparo el meu formulari: quan faig clic al botó de submit ("Guardar" o "Actualitzar"), 
// faig que s'executi la meva funció 'handleFormSubmit'.
movieForm.addEventListener('submit', handleFormSubmit);

// I si l'usuari clica "Cancel·lar" a mitja edició, crido a 'resetForm' per netejar-ho tot.
cancelBtn.addEventListener('click', resetForm);


/* =========================================================================
   3. OPERACIÓ LLEGIR (R - READ): OBTENIR I MOSTRAR DADES
   ========================================================================= */

// He creat aquesta funció ASÍNCRONA per demanar les pel·lícules al meu backend.
// Utilitzo 'async/await' perquè la petició a la xarxa no em bloquegi la pàgina mentre espero la resposta.
async function fetchMovies() {
    try {
        // Faig una petició GET al meu endpoint de FastAPI per obtenir totes les pel·lícules.
        const response = await fetch(`${API_URL}/pelicules/`); 
        
        // Si el meu backend em retorna un error (com un 404), faig saltar una excepció.
        if (!response.ok) throw new Error('Error al carregar les pel·lícules');
        
        // Converteixo la resposta del meu servidor a un objecte JSON manejable.
        const data = await response.json();
        
        // Com que al meu backend 'app.py' vaig dissenyar el model PeliculaCollection 
        // per retornar la llista dins de la clau "pelicules", l'extrec d'allà.
        const movies = data.pelicules; 
        
        // Finalment, li passo aquesta llista a la meva funció encarregada de "dibuixar" la taula.
        renderTable(movies);
    } catch (error) {
        console.error(error);
        alert("No m'he pogut connectar amb el servidor. He de comprovar que el FastAPI estigui encès.");
    }
}

// Amb aquesta funció agafo la llista de pel·lícules i construeixo la taula a l'HTML.
function renderTable(movies) {
    // Primer, buido el contingut de la taula perquè no se'm dupliquin les dades quan recarrego.
    moviesTableBody.innerHTML = '';

    // Faig un bucle per recórrer cadascuna de les pel·lícules que m'ha donat el backend.
    movies.forEach(movie => {
        // Tinc en compte que el meu backend pot exposar l'id com a 'id' o '_id'.
        const id = movie.id || movie._id; 
        
        // Creo una nova fila HTML (tr) des de JavaScript.
        const tr = document.createElement('tr');
        
        // Poso una condició senzilla perquè l'estat 'vista' surti en verd i el pendent en taronja.
        const statusColor = movie.estat === 'vista' ? 'color: green;' : 'color: orange;';

        // Omplo la fila amb els camps de la meva pel·lícula i hi afegeixo els botons d'Editar i Esborrar.
        // Li passo l'ID com a paràmetre als botons per saber sobre quina pel·lícula vull actuar.
        tr.innerHTML = `
            <td><strong>${movie.titol}</strong><br><small>${movie.descripcio}</small></td>
            <td style="${statusColor}">${movie.estat}</td>
            <td>${movie.puntuacio}/10</td>
            <td>${movie.genere}</td>
            <td>${movie.usuari}</td>
            <td>
                <button class="button button-outline button-small" onclick="editMovie('${id}')">Editar</button>
                <button class="button button-clear button-small" style="color: red;" onclick="deleteMovie('${id}')">Esborrar</button>
            </td>
        `;
        // I l'enganxo al cos de la meva taula HTML.
        moviesTableBody.appendChild(tr);
    });
}


/* =========================================================================
   4. OPERACIONS CREAR I ACTUALITZAR (C & U - CREATE & UPDATE)
   ========================================================================= */

// Aquesta és la funció que s'encarrega de processar el meu formulari quan l'envio.
async function handleFormSubmit(event) {
    // Evito que la pàgina es recarregui (que és el que fan els formularis per defecte).
    event.preventDefault();

    // Recopilo totes les dades que acabo d'escriure als diferents inputs.
    const movieData = {
        titol: document.getElementById('titol').value,
        descripcio: document.getElementById('descripcio').value,
        estat: document.getElementById('estat').value,
        puntuacio: parseInt(document.getElementById('puntuacio').value), // M'asseguro d'enviar un número enter
        genere: document.getElementById('genere').value,
        usuari: document.getElementById('usuari').value
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
        // perquè la taula mostri el canvi immediatament.
        resetForm();
        fetchMovies();
    } catch (error) {
        console.error(error);
        alert("He tingut un error al desar la pel·lícula.");
    }
}


/* =========================================================================
   5. OPERACIÓ ESBORRAR (D - DELETE)
   ========================================================================= */

// Aquesta funció la llenço quan clico el botó "Esborrar" d'una fila concreta.
async function deleteMovie(id) {
    // Per evitar esborrats accidentals, faig que salti un missatge de confirmació al navegador.
    if (!confirm('Estàs segur que vols esborrar aquesta pel·lícula?')) return;

    try {
        // Envio una petició amb el mètode DELETE a l'endpoint del meu backend per destruir l'element.
        await fetch(`${API_URL}/pelicules/${id}`, { 
            method: 'DELETE' 
        });
        
        // Torno a carregar la taula perquè la pel·lícula esborrada ja no hi surti.
        fetchMovies();
    } catch (error) {
        console.error(error);
        alert("Error al esborrar la pel·lícula.");
    }
}


/* =========================================================================
   6. FUNCIONS AUXILIARS I DE GESTIÓ DEL FORMULARI INTERFÍCIE
   ========================================================================= */

// Utilitzo aquesta funció per preparar el meu formulari quan vull editar.
async function editMovie(id) {
    try {
        // Primer, faig un GET per obtenir totes les dades d'AQUESTA pel·lícula en concret.
        const response = await fetch(`${API_URL}/pelicules/${id}`);
        const movie = await response.json();

        // Ara, poso manualment els valors recuperats dins dels camps de text del meu formulari.
        movieIdInput.value = movie.id || movie._id; // Guardo l'ID d'amagat perquè el submit sàpiga que és una edició.
        document.getElementById('titol').value = movie.titol;
        document.getElementById('descripcio').value = movie.descripcio;
        document.getElementById('estat').value = movie.estat;
        document.getElementById('puntuacio').value = movie.puntuacio;
        document.getElementById('genere').value = movie.genere;
        document.getElementById('usuari').value = movie.usuari;

        // Canvio la interfície per fer evident que ara estem editant: canvio el títol 
        // i mostro el botó de cancel·lar per si l'usuari es penedeix.
        formTitle.textContent = 'Editar Pel·lícula';
        submitBtn.textContent = 'Actualitzar';
        cancelBtn.style.display = 'inline-block';
    } catch (error) {
        console.error(error);
        alert("No he pogut carregar les dades de la pel·lícula per editar-la.");
    }
}

// Finalment, he dissenyat aquesta funció per "reiniciar" la meva interfície.
function resetForm() {
    // Buidar de cop tots els camps escrits.
    movieForm.reset(); 
    
    // Assegurar-me que esborro l'ID ocult (molt important perquè el pròxim cop guardi i no sobrescrigui).
    movieIdInput.value = '';
    
    // Retorno la interfície a l'estat original (mode "Afegir").
    formTitle.textContent = 'Afegir Pel·lícula';
    submitBtn.textContent = 'Guardar';
    cancelBtn.style.display = 'none';
}
