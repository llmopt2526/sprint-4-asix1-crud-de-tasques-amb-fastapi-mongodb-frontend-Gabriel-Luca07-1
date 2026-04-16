/* =======================================================================
   1. CONFIGURACIÓ PRINCIPAL I REFERÈNCIES
   Definim la URL on treballa FastAPI. També "capturem" els elements del 
   nostre HTML (formulari i taula) utilitzant el seu ID perquè el JS pugui
   interactuar amb ells.
   ======================================================================= */
const API_URL = "http://localhost:8000"; 
const formulari = document.getElementById('formulari-tasca');
const taulaTasques = document.getElementById('taula-tasques');

/* =======================================================================
   2. READ: OBTENIR I MOSTRAR LES TASQUES (GET)
   Funció clau. Fa un 'fetch' (una trucada) a FastAPI per demanar les dades.
   L'ús de 'await' fa que el codi s'esperi fins que MongoDB respongui abans 
   de continuar. Després fabrica una fila d'HTML per cada tasca trobada.
   ======================================================================= */
async function carregarTasques() {
    try {
        const resposta = await fetch(`${API_URL}/tasques`);
        const tasques = await resposta.json();

        // Netejar la taula per evitar duplicar contingut al recarregar
        taulaTasques.innerHTML = "";

        tasques.forEach(tasca => {
            // Si la tasca està feta, preparem les variables de CSS i del Checkbox
            const esCompletada = tasca.completada ? 'tasca-completada' : '';
            const check = tasca.completada ? 'checked' : '';

            // Utilitzem cometes inverses (`) per injectar codi HTML i variables
            const fila = `
                <tr class="${esCompletada}">
                    <td>
                        <input type="checkbox" ${check} onchange="actualitzarTasca('${tasca.id}', ${tasca.completada})">
                    </td>
                    <td><strong>${tasca.titol}</strong></td>
                    <td>${tasca.descripcio || '-'}</td>
                    <td>
                        <button class="button boto-esborrar" onclick="esborrarTasca('${tasca.id}')">Esborrar</button>
                    </td>
                </tr>
            `;
            // Afegim la fila construïda a l'HTML real de la pàgina
            taulaTasques.innerHTML += fila;
        });
    } catch (error) {
        console.error("Error al carregar les tasques:", error);
    }
}

/* =======================================================================
   3. CREATE: CREAR UNA TASCA NOVA (POST)
   Això escolta l'esdeveniment 'submit' (quan l'usuari clica a Afegir).
   Usem event.preventDefault() per evitar que el navegador recarregui la
   pàgina (el comportament antic dels formularis) i ho enviem per darrere.
   ======================================================================= */
formulari.addEventListener('submit', async function(event) {
    event.preventDefault(); 

    // Muntem l'objecte JSON amb el que l'usuari ha escrit a les caixes
    const novaTasca = {
        titol: document.getElementById('titolTasca').value,
        descripcio: document.getElementById('descTasca').value,
        completada: false
    };

    try {
        await fetch(`${API_URL}/tasques`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaTasca)
        });

        // Buidem les caixes de text del formulari
        formulari.reset(); 
        // Tornem a carregar la taula perquè aparegui la nova tasca visualment
        carregarTasques(); 
    } catch (error) {
        console.error("Error al crear la tasca:", error);
    }
});

/* =======================================================================
   4. UPDATE: ACTUALITZAR L'ESTAT (PUT o PATCH)
   S'activa quan marquem/desmarquem un checkbox. Envia a FastAPI l'ordre de 
   canviar l'estat a l'invers (si estava false ho passa a true i viceversa).
   ======================================================================= */
async function actualitzarTasca(id, estatActual) {
    try {
        await fetch(`${API_URL}/tasques/${id}`, {
            method: 'PUT', // CANVIA A 'PATCH' SI AL TEU FASTAPI HO TENS COM A PATCH
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completada: !estatActual })
        });
        
        // Recarreguem la taula perquè s'apliqui la línia ratllada del CSS
        carregarTasques(); 
    } catch (error) {
        console.error("Error en actualitzar:", error);
    }
}

/* =======================================================================
   5. DELETE: ESBORRAR UNA TASCA
   S'activa al clicar el botó vermell. Fa saltar un avís (confirm) per 
   evitar esborrats accidentals abans de llançar el mètode DELETE al backend.
   ======================================================================= */
async function esborrarTasca(id) {
    if(confirm("N'estàs segur de voler esborrar aquesta tasca?")) {
        try {
            await fetch(`${API_URL}/tasques/${id}`, {
                method: 'DELETE'
            });
            // Recarreguem la taula perquè la tasca desaparegui visualment
            carregarTasques();
        } catch (error) {
            console.error("Error en esborrar:", error);
        }
    }
}

/* =======================================================================
   6. INICI DE L'APLICACIÓ
   Aquesta línia és vital. Quan el navegador acaba de llegir tot aquest arxiu,
   executa aquesta funció automàticament perquè la taula s'ompli de dades
   el mateix segon en què obres la pàgina web.
   ======================================================================= */
carregarTasques();
