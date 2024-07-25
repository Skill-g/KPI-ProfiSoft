import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const connectToDB = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to MySQL database");

    return prisma;
  } catch (error) {
    console.error("Error connecting to MySQL:", error);
    throw error;
  }
};

export default connectToDB;

