import os
from typing import Optional, List
from fastapi import FastAPI, Body, HTTPException, status, Query
from pydantic import ConfigDict, BaseModel, Field
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated
from pymongo import AsyncMongoClient, ReturnDocument
from bson import ObjectId
from bson.errors import InvalidId

# ------------------------------------------------------------------------ #
# 1. INICIALITZACIÓ DE L'APLICACIÓ                                         #
# ------------------------------------------------------------------------ #
# Creem la instància de FastAPI. Aquest objecte 'app' és el motor de la    #
# nostra API i gestionarà totes les peticions HTTP (GET, POST, etc.)       #
# ------------------------------------------------------------------------ #
app = FastAPI(
    title="API Gestor de Pel·lícules",
    summary="API REST amb FastAPI i MongoDB per gestionar pel·lícules",
)

# ------------------------------------------------------------------------ #
# 2. CONFIGURACIÓ DE LA CONNEXIÓ AMB MONGODB                               #
# ------------------------------------------------------------------------ #
# Utilitza la variable d'entorn MONGODB_URL. Si no existeix, falla de forma segura
# connectant-se a un MongoDB local per defecte.
# AsyncMongoClient permet connectar-se sense bloquejar el servidor.
mongodb_url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncMongoClient(mongodb_url)

# Seleccionem la base de dades i la col·lecció on es guardaran els documents
db = client.movies_database
movies_collection = db.get_collection("movies")

# Definim PyObjectId com un string serialitzable per JSON. 
# MongoDB utilitza '_id' de tipus 'ObjectId', i això ajuda a que el 
# navegador ho pugui entendre com a text normal.
PyObjectId = Annotated[str, BeforeValidator(str)]

# ------------------------------------------------------------------------ #
# 3. DEFINICIÓ DELS MODELS (PYDANTIC)                                      #
# ------------------------------------------------------------------------ #
# Els models defineixen QUINA forma tenen les dades i les validen.         #
# ------------------------------------------------------------------------ #
class PeliculaModel(BaseModel):
    """ Model principal per a crear i llegir pel·lícules """
    # L'alias "_id" fa que FastAPI sàpiga que aquest camp correspon a l'_id de MongoDB
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    titol: str = Field(...)
    descripcio: str = Field(...)
    # 'pattern' assegura que l'estat només pugui ser un d'aquests dos valors exactes
    estat: str = Field(json_schema_extra={"pattern": "^(pendent de veure|vista)$"}, default="pendent de veure")
    # Validem que la puntuació estigui entre 1 i 5
    puntuacio: int = Field(ge=0, le=10)
    genere: str = Field(...)
    usuari: str = Field(...) 

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "titol": "Dune: Part Two",
                "descripcio": "En Paul Atreides s'uneix als Fremen...",
                "estat": "vista",
                "puntuacio": 5,
                "genere": "Ciència Ficció",
                "usuari": "maria_garcia"
            }
        },
    )

class UpdatePeliculaModel(BaseModel):
    """ Model per actualitzar pel·lícules. Tots els camps són opcionals per permetre edicions parcials. """
    titol: Optional[str] = None
    descripcio: Optional[str] = None
    estat: Optional[str] = Field(None, json_schema_extra={"pattern": "^(pendent de veure|vista)$"})
    puntuacio: Optional[int] = Field(None, ge=0, le=10)
    genere: Optional[str] = None
    usuari: Optional[str] = None

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "estat": "vista",
                "puntuacio": 4
            }
        },
    )

class PeliculaCollection(BaseModel):
    """ Model que fa de contenidor per retornar una llista de pel·lícules """
    pelicules: List[PeliculaModel]

# ------------------------------------------------------------------------ #
# 4. ENDPOINTS (LÒGICA CRUD)                                               #
# ------------------------------------------------------------------------ #

# --- CREATE (Crear una pel·lícula) ---
@app.post(
    "/pelicules/",
    response_description="Afegir nova pel·lícula",
    response_model=PeliculaModel,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def create_pelicula(pelicula: PeliculaModel = Body(...)):
    # .insert_one() guarda les dades a MongoDB (excloent el camp id perquè el crea Mongo)
    new_pelicula = await movies_collection.insert_one(
        pelicula.model_dump(by_alias=True, exclude=["id"])
    )
    # Recuperem el document acabat de crear per confirmar-ho i retornar-lo
    created_pelicula = await movies_collection.find_one(
        {"_id": new_pelicula.inserted_id}
    )
    return created_pelicula

# --- READ ALL (Llistar amb filtres de classificació) ---
@app.get(
    "/pelicules/",
    response_description="Llistar totes les pel·lícules",
    response_model=PeliculaCollection,
    response_model_by_alias=False,
)
async def list_pelicules(
    genere: Optional[str] = Query(None, description="Filtrar per categoria/gènere"),
    puntuacio: Optional[int] = Query(None, description="Filtrar per puntuació")
):
    # Creem una cerca buida i afegim condicions només si ens envien els filtres per la URL
    query = {}
    if genere:
        query["genere"] = genere
    if puntuacio:
        query["puntuacio"] = puntuacio

    # Convertim el resultat de MongoDB a una llista de Python (límit de 1000)
    pelicules = await movies_collection.find(query).to_list(1000)
    return PeliculaCollection(pelicules=pelicules)

# --- READ ONE (Llegir una pel·lícula per ID) ---
@app.get(
    "/pelicules/{id}",
    response_description="Obtenir una pel·lícula",
    response_model=PeliculaModel,
    response_model_by_alias=False,
)
async def show_pelicula(id: str):
    # Intentem convertir l'ID de text a un ObjectId real de MongoDB
    try:
        obj_id = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID invàlid")

    # Si trobem la peli, la retornem. Si no, donem un error 404 (No trobat)
    if (pelicula := await movies_collection.find_one({"_id": obj_id})) is not None:
        return pelicula
    raise HTTPException(status_code=404, detail=f"Pel·lícula {id} no trobada")

# --- UPDATE (Editar, canviar estat, assignar usuari) ---
@app.put(
    "/pelicules/{id}",
    response_description="Actualitzar una pel·lícula",
    response_model=PeliculaModel,
    response_model_by_alias=False,
)
async def update_pelicula(id: str, pelicula: UpdatePeliculaModel = Body(...)):
    try:
        obj_id = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID invàlid")

    # Netegem les dades per agafar NOMÉS aquells camps que no estiguin buits (None)
    pelicula_dict = {
        k: v for k, v in pelicula.model_dump(by_alias=True).items() if v is not None
    }

    # Si ens han passat algun camp vàlid per modificar, ho guardem amb '$set'
    if len(pelicula_dict) >= 1:
        update_result = await movies_collection.find_one_and_update(
            {"_id": obj_id},
            {"$set": pelicula_dict},
            return_document=ReturnDocument.AFTER, # Això fa que retorni la peli un cop ja modificada
        )
        if update_result is not None:
            return update_result
        else:
            raise HTTPException(status_code=404, detail=f"Pel·lícula {id} no trobada")

    # Si no hi ha camps per actualitzar (dict buit), simplement retornem l'element existent
    if (existing_pelicula := await movies_collection.find_one({"_id": obj_id})) is not None:
        return existing_pelicula

    raise HTTPException(status_code=404, detail=f"Pel·lícula {id} no trobada")

# --- DELETE (Eliminar una pel·lícula) ---
@app.delete(
    "/pelicules/{id}",
    response_description="Eliminar una pel·lícula",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_pelicula(id: str):
    try:
        obj_id = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID invàlid")

    # Eliminem el document directament
    delete_result = await movies_collection.delete_one({"_id": obj_id})

    # Si ha eliminat 1 document, l'operació ha estat un èxit
    if delete_result.deleted_count == 1:
        return None

    raise HTTPException(status_code=404, detail=f"Pel·lícula {id} no trobada")
