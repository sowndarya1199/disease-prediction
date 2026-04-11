from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    gender = Column(String)
    height = Column(Float)
    weight = Column(Float)
    
   
    diabetes = Column(Boolean, default=False)
    hypertension = Column(Boolean, default=False)  
    
   
    smoking = Column(Boolean, default=False)
    alcohol_consumption = Column(Boolean, default=False)
    
   
    other_medical_history = Column(String, nullable=True)
    approval_status = Column(String, default="Registered") 
    lab_report_path = Column(String, nullable=True) 

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)

class Symptom(Base):
    __tablename__ = "symptoms"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    raw_text = Column(String) # Store original input text
    processed_data = Column(String) # JSON list of identified clinical features
    severity = Column(Integer)
    duration = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="symptoms")

Patient.symptoms = relationship("Symptom", back_populates="patient")

class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    test_name = Column(String)
    value = Column(String)
    unit = Column(String)
    is_abnormal = Column(Boolean, default=False)
    reference_range = Column(String)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="lab_results")

Patient.lab_results = relationship("LabResult", back_populates="patient")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    patient_name = Column(String)
    risk_level = Column(String)
    message = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient")

class ClinicalValidation(Base):
    __tablename__ = "clinical_validations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    decision = Column(String) # Accept, Modify, Override
    observations = Column(String, nullable=True)
    final_diagnosis = Column(String, nullable=True)
    prescription_notes = Column(String, nullable=True)
    override_reason = Column(String, nullable=True)
    custom_factors = Column(String, nullable=True) # Stores JSON list of doctor-defined factors
    is_draft = Column(Boolean, default=False)
    diet_plan = Column(String, nullable=True) # Stores JSON diet recommendation
    doctor_name = Column(String, nullable=True)
    signature_path = Column(String, nullable=True) # Path to uploaded doctor signature image
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="clinical_validations")

Patient.clinical_validations = relationship("ClinicalValidation", back_populates="patient")
