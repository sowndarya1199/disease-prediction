from pydantic import BaseModel
import datetime
from typing import Optional, Literal

class UserCreate(BaseModel):
    username: str
    password: str
    role: Literal["admin", "doctor", "nurse", "user", "patient"]

class PatientBase(BaseModel):
    name: str
    age: int
    gender: str
    height: float
    weight: float
    diabetes: bool = False
    hypertension: bool = False
    smoking: bool = False
    alcohol_consumption: bool = False
    other_medical_history: Optional[str] = None
    approval_status: str = "Registered"

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: int

    class Config:
        from_attributes = True

class SymptomBase(BaseModel):
    raw_text: str
    severity: int
    duration: str

class SymptomCreate(SymptomBase):
    patient_id: int

class Symptom(SymptomBase):
    id: int
    patient_id: int
    processed_data: str 
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class LabResultBase(BaseModel):
    test_name: str
    value: str
    unit: str

class LabResultCreate(LabResultBase):
    patient_id: int

class LabResult(LabResultBase):
    id: int
    patient_id: int
    is_abnormal: bool
    reference_range: str
    recorded_at: datetime.datetime

    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    patient_id: int
    patient_name: str
    risk_level: str
    message: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime.datetime] = None

class Notification(NotificationBase):
    id: int

    class Config:
        from_attributes = True

class ClinicalValidationBase(BaseModel):
    decision: str
    observations: Optional[str] = None
    final_diagnosis: Optional[str] = None
    prescription_notes: Optional[str] = None
    override_reason: Optional[str] = None
    custom_factors: Optional[str] = None
    diet_plan: Optional[str] = None
    is_draft: bool = False
    doctor_name: Optional[str] = None
    signature_path: Optional[str] = None

class ClinicalValidationCreate(ClinicalValidationBase):
    patient_id: int

class ClinicalValidation(ClinicalValidationBase):
    id: int
    patient_id: int
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

