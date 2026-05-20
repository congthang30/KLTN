import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  doctorName: string;

  @IsString()
  @IsNotEmpty()
  licenseId: string;

  @IsString()
  @IsNotEmpty()
  identityNumber: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsString()
  @IsNotEmpty()
  specialties: string;

  @IsString()
  @IsNotEmpty()
  degree: string;

  @IsString()
  @IsNotEmpty()
  facultyOfWork: string;

  @IsString()
  @IsNotEmpty()
  dateOfBirth: string; // ISO date string

  @IsString()
  @IsNotEmpty()
  workingStartDate: string; // ISO date string

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  tempPassword: string;

  /** JSON string of number[] — face embedding extracted on client side */
  @IsOptional()
  @IsString()
  faceEmbedding?: string;
}
