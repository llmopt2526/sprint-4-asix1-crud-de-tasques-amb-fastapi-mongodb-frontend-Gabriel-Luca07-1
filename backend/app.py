import os
from typing import Optional, List

from fastapi import FastAPI, Body, HTTPException, status
from fastapi.responses import Response
from pydantic import ConfigDict, BaseModel, Field, EmailStr
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated

from bson import ObjectId
import asyncio
from pymongo import AsyncMongoClient
from pymongo import ReturnDocument

# ------------------------------------------------------------------------ #
#                         Inicialització de l'aplicació                    #
# ------------------------------------------------------------------------ #
# Creació de la instància FastAPI amb informació bàsica de l'API
app = FastAPI(
    title="Student Course API",
    summary="Exemple d'API REST amb FastAPI i MongoDB per gestionar informació d'estudiants",
)

# ------------------------------------------------------------------------ #
#                   Configuració de la connexió amb MongoDB                #
# ------------------------------------------------------------------------ #
# Creem el client de MongoDB utilitzant la URL de connexió emmagatzemada
# a les variables d'entorn. Això evita incloure credencials dins del codi.
client = AsyncMongoClient(os.environ["MONGODB_URL"])

# Selecció de la base de dades i de la col·lecció
db = client.college
student_collection = db.get_collection("students")

# Els documents de MongoDB tenen `_id` de tipus ObjectId.
# Aquí definim PyObjectId com un string serialitzable per JSON,
# que serà utilitzat als models Pydantic.
PyObjectId = Annotated[str, BeforeValidator(str)]

# ------------------------------------------------------------------------ #
#                            Definició dels models                         #
# ------------------------------------------------------------------------ #
class StudentModel(BaseModel):
    """
    Model que representa un estudiant.
    Conté tots els camps obligatoris i opcional `_id`.
    """
    # Clau primària de l'estudiant. 
    # MongoDB utilitza `_id`, però l'API exposa aquest camp com `id`.
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    # Camps obligatoris de l'estudiant
    name: str = Field(...)
    email: EmailStr = Field(...)
    course: str = Field(...)
    gpa: float = Field(..., le=4.0)

    # Configuració addicional del model Pydantic
    model_config = ConfigDict(
        populate_by_name=True,  # Permet utilitzar alias al serialitzar/deserialitzar
        arbitrary_types_allowed=True,  # Permet tipus personalitzats com ObjectId
        json_schema_extra={
            "example": {
                "name": "Jane Doe",
                "email": "jdoe@example.com",
                "course": "Experiments, Science, and Fashion in Nanophotonics",
                "gpa": 3.0,
            }
        },
    )