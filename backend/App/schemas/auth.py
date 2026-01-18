from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=100)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Schema for user data in responses"""
    id: int
    email: str
    username: str
    
    class Config:
        from_attributes = True