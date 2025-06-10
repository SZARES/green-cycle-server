import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface IUser extends Document {
    fullName: string;
    displayName: string;
    isValidEmail(email: string): boolean;
}

export type UserDocument = User & IUser;

@Schema({ timestamps: true })
export class User extends Document {


    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop()
    avatar?: string;

    @Prop()
    city?: string;

    @Prop()
    country?: string;

    @Prop()
    description?: string;

    @Prop({ default: false })
    isVerified: boolean;

    @Prop({ type: [String], default: [] })
    ecoInterests: string[];

    @Prop({
        type: {
            instagram: String,
            facebook: String,
            twitter: String,
            website: String,
        },
        default: {},
    })
    socialLinks: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        website?: string;
    };

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    lastLoginAt?: Date;

    @Prop({ default: false })
    emailVerified: boolean;

    @Prop({ default: 'user', enum: ['user', 'admin', 'moderator'] })
    role: string;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ city: 1, country: 1 });

// Métodos virtuales
UserSchema.virtual('fullName').get(function (this: UserDocument) {
    return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('displayName').get(function (this: UserDocument) {
    return `${this.firstName} ${this.lastName}`;
});

// Método para verificar email
UserSchema.methods.isValidEmail = function (email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
