import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../src/utils/prisma.js';

async function main() {
  const adminPassword = await bcrypt.hash('Admin123', 12);
  const testPassword = await bcrypt.hash('Test123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@apartment.com' },
    update: { password: adminPassword, isActive: true, name: 'Admin User' },
    create: {
      email: 'admin@apartment.com',
      password: adminPassword,
      name: 'Admin User',
      phoneNumber: '+1234567890',
      role: 'admin',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'maintenance@apartment.com' },
    update: { password: testPassword, isActive: true, name: 'Maintenance User' },
    create: {
      email: 'maintenance@apartment.com',
      password: testPassword,
      name: 'Maintenance User',
      phoneNumber: '+1234567892',
      role: 'maintenance',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'landlord@apartment.com' },
    update: { password: testPassword, isActive: true, name: 'Landlord User' },
    create: {
      email: 'landlord@apartment.com',
      password: testPassword,
      name: 'Landlord User',
      phoneNumber: '+1234567891',
      role: 'landlord',
      isActive: true,
    },
  });

  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        contactEmail: 'contact@apartment.com',
        contactPhone: '+1234567890',
        // Long Google embed URLs exceed MySQL VARCHAR(191); optional — set in Admin or use @db.Text on map_embed_url
        mapEmbedUrl: null,
      },
    });
  }

  let building1 = await prisma.building.findFirst({ where: { name: 'Building A - Riverside' } });
  if (!building1) {
    building1 = await prisma.building.create({
      data: {
        name: 'Building A - Riverside',
        address: '123 Riverside Drive',
        description: 'Modern apartment building with stunning river views.',
        facilities: JSON.stringify(['Gym', 'Pool', 'Parking', 'Security 24/7', 'Elevator']),
        images: JSON.stringify(['/buildings/building-a-1.jpg']),
      },
    });
  }
  let building2 = await prisma.building.findFirst({ where: { name: 'Building B - Garden View' } });
  if (!building2) {
    building2 = await prisma.building.create({
      data: {
        name: 'Building B - Garden View',
        address: '456 Garden Street',
        description: 'Peaceful living with beautiful garden surroundings.',
        facilities: JSON.stringify(['Garden', 'Playground', 'BBQ Area', 'Parking']),
        images: JSON.stringify(['/buildings/building-b-1.jpg']),
      },
    });
  }
  let building3 = await prisma.building.findFirst({ where: { name: 'Building C - Downtown' } });
  if (!building3) {
    building3 = await prisma.building.create({
      data: {
        name: 'Building C - Downtown',
        address: '789 Downtown Avenue',
        description: 'Central location with easy access to everything.',
        facilities: JSON.stringify(['Rooftop', 'Concierge', 'Bike Storage', 'Package Room']),
        images: JSON.stringify(['/buildings/building-c-1.jpg']),
      },
    });
  }
  const building1Id = building1.id;

  const roomData = [
    { buildingId: building1Id, roomNumber: '101', floor: 1, capacity: 1, monthlyRent: 800, amenities: ['WiFi', 'AC', 'Balcony'] },
    { buildingId: building1Id, roomNumber: '102', floor: 1, capacity: 2, monthlyRent: 1200, amenities: ['WiFi', 'AC', 'Parking'] },
    { buildingId: building1Id, roomNumber: '201', floor: 2, capacity: 3, monthlyRent: 1500, amenities: ['WiFi', 'AC', 'Balcony', 'Parking'] },
    { buildingId: building2.id, roomNumber: '101', floor: 1, capacity: 1, monthlyRent: 750, amenities: ['WiFi', 'AC'] },
    { buildingId: building2.id, roomNumber: '202', floor: 2, capacity: 2, monthlyRent: 1100, amenities: ['WiFi', 'AC', 'Garden View'] },
    { buildingId: building3.id, roomNumber: '301', floor: 3, capacity: 2, monthlyRent: 1300, amenities: ['WiFi', 'AC', 'City View'] },
  ];

  for (const room of roomData) {
    const existing = await prisma.room.findFirst({
      where: { buildingId: room.buildingId, roomNumber: room.roomNumber },
    });
    if (!existing) {
      await prisma.room.create({
        data: {
          ...room,
          amenities: JSON.stringify(room.amenities),
          images: JSON.stringify(['/rooms/default.jpg']),
          isAvailable: true,
        },
      });
    }
  }

  const tenantRoomForUser = await prisma.room.findFirst({ where: { buildingId: building1Id, roomNumber: '101' } });
  await prisma.user.upsert({
    where: { email: 'tenant@apartment.com' },
    update: { password: testPassword, roomId: tenantRoomForUser?.id, isActive: true, name: 'Tenant User' },
    create: {
      email: 'tenant@apartment.com',
      password: testPassword,
      name: 'Tenant User',
      phoneNumber: '+1234567893',
      role: 'tenant',
      isActive: true,
      roomId: tenantRoomForUser?.id,
    },
  });

  const faqs = [
    { question: 'What is the minimum lease period?', answer: 'Our minimum lease period is 6 months.', order: 1 },
    { question: 'Are utilities included?', answer: 'Water and trash are included. Electricity and internet are tenant responsibility.', order: 2 },
    { question: 'Is parking available?', answer: 'Yes, parking is available at an additional monthly fee.', order: 3 },
  ];

  const existingFaqs = await prisma.faq.count();
  if (existingFaqs === 0) {
    for (const faq of faqs) {
      await prisma.faq.create({ data: faq });
    }
  }

  console.log('Seed completed. Test accounts:');
  console.log('  Admin:        admin@apartment.com / Admin123');
  console.log('  Landlord:     landlord@apartment.com / Test123');
  console.log('  Maintenance:  maintenance@apartment.com / Test123');
  console.log('  Tenant:       tenant@apartment.com / Test123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
