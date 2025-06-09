import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getMongoConfig = (): MongooseModuleOptions => {
  return {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/green-cycle',
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
}; 