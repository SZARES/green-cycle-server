import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Crear el nuevo usuario
    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return newUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    }
    return user;
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    // Si se está actualizando el email, verificar que no exista
    if (updateData.email) {
      const existingUser = await this.userModel.findOne({ 
        email: updateData.email,
        _id: { $ne: id }
      });
      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Si se está actualizando la contraseña, hashearla
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new BadRequestException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Credenciales inválidas');
    }

    return user;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      { $set: { lastLoginAt: new Date() } }
    ).exec();
  }

  async updateEcoInterests(id: string, interests: string[]): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { ecoInterests: interests } },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return updatedUser;
  }

  async updateSocialLinks(id: string, socialLinks: any): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { socialLinks } },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return updatedUser;
  }
}
