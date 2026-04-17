# Gestor de Pel·lícules: Full-Stack App amb FastAPI i Vanilla JS

Aquest repositori conté el meu projecte personal per gestionar una col·lecció de pel·lícules. És una aplicació web Full-Stack dissenyada per permetre operacions de creació, lectura, actualització i esborrat (CRUD) de manera ràpida i intuïtiva, separant clarament la lògica del servidor (backend) de la interfície d'usuari (frontend).

---

## Estructura del projecte

```
├── .github/
│   └── .keep
├── backend/
│   ├── .env
│   ├── .gitignore
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── javascript.js
│   └── styles.css
└── tests/
    └── postman_API_tests.json
```

- **backend/**: Conté tota la lògica del servidor construïda amb FastAPI i la connexió a MongoDB.  
- **frontend/**: Conté els fitxers HTML, CSS, JS de la interfície d'usuari.  
- **tests/**: Inclou els fitxers necessaris per comprovar el bon funcionament de l'API.  

---

## Requisits previs

Abans de fer servir l'aplicació, has d'assegurar-te de tenir instal·lat al teu sistema:

- Python 3.8 o una versió superior.  
- Accés a una base de dades MongoDB (pot ser local o mitjançant MongoDB Atlas).  
- Postman (opcional, però recomanat per executar els tests de l'API).  

---

## Configuració del Backend

El primer pas és posar en marxa el servidor de l'API. Totes les comandes següents s'han d'executar des de dins de la carpeta `backend/`.

### Instal·lació de dependències

He preparat un fitxer `requirements.txt` amb totes les llibreries necessàries (com FastAPI, Uvicorn, Motor o Pydantic).

Per instal·lar-les:

```bash
cd backend
pip install -r requirements.txt
```

### Variables d'entorn (.env) i seguretat (.gitignore)

Per connectar el backend amb la base de dades sense exposar credencials sensibles, utilitzo un fitxer anomenat `.env`.

Dins d'aquesta carpeta `backend/`, has d'obrir aquest fitxer i configurar la teva pròpia URL de connexió a MongoDB. Hauria de tenir aquest format:

```env
MONGODB_URL="mongodb+srv://:@cluster.mongodb.net/el_teu_buid"
```

A la mateixa carpeta hi ha un fitxer `.gitignore`. Aquest fitxer és vital perquè indica a Git quins arxius no s'han de pujar mai al repositori públic.

Principalment:
- Ignora el fitxer `.env` (per protegir credencials)
- Ignora la carpeta `__pycache__/` (fitxers temporals de Python)

### Executar el servidor

Un cop instal·lades les dependències i configurat el fitxer `.env`, pots arrencar el servidor amb:

```bash
uvicorn app:app --reload
```

---

## Comprovació de l'API amb Postman (Tests)

Abans d'obrir la pàgina web, és una bona pràctica comprovar que el backend funciona correctament i es connecta a la base de dades.

Passos:

1. Obre el programa Postman.  
2. Ves a l'opció "Import" i selecciona el fitxer `postman_API_tests.json` que es troba dins la carpeta `tests/`.  
3. Això carregarà una col·lecció de peticions (GET, POST, PUT, DELETE) preparades apuntant a `localhost:8000`.  
4. Executa-les per verificar que el backend respon correctament i guarda les dades a MongoDB.  

---
<img width="1065" height="825" alt="image" src="https://github.com/user-attachments/assets/7242b6e4-abb0-4aae-acea-b16ad0140d81" />

## Configuració del Frontend

La part visual de l'aplicació no requereix cap procés d'instal·lació complex.

- Ves a la carpeta `frontend/`.  
- Obre el fitxer `index.html` directament amb el teu navegador web preferit (o utilitza eines com Live Server si utilitzes VS Code).  

### Nota sobre la connexió

El fitxer `javascript.js` té definida una constant `API_URL` que apunta a:

```
http://localhost:8000
```

Si decideixes desplegar el backend en un servidor remot de producció, hauràs de modificar aquesta línia amb la nova adreça.

---

## Visualització de la interfície

A continuació es mostra l'aparença principal de l'aplicació un cop està en funcionament:

<img width="1633" height="1013" alt="image" src="https://github.com/user-attachments/assets/07b1cfc9-7bdd-45f4-98cd-fe0120b9f083" />

