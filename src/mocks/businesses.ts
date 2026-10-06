import type { Business } from '@/types/domain';

/**
 * Seed businesses (AGENTS.md §12): one per category, Mexico City vibe.
 *
 * Ids are stable, readable strings — not random UUIDs — so §14 curl smoke
 * tests and the relative-date appointment seeds (mocks/appointments.ts) can
 * reference them deterministically. Business `createdAt` is a fixed demo
 * timestamp; only appointment dates are time-relative (generated at store
 * creation, per D23).
 */
export const seedBusinesses: Business[] = [
  {
    id: 'biz-barberia-don-rafa',
    slug: 'barberia-don-rafa',
    name: 'Barbería Don Rafa',
    category: 'barbershop',
    phone: '55 4101 2233',
    address: 'Av. Coyoacán 812, Col. Del Carmen',
    city: 'Ciudad de México',
    // 0 = Sunday (Date#getDay()). Closed Mondays; Sun half day; Tue–Sat full.
    hours: {
      0: { open: '10:00', close: '14:00' },
      1: null,
      2: { open: '10:00', close: '19:00' },
      3: { open: '10:00', close: '19:00' },
      4: { open: '10:00', close: '19:00' },
      5: { open: '10:00', close: '19:00' },
      6: { open: '10:00', close: '19:00' },
    },
    services: [
      {
        id: 'svc-rafa-corte-clasico',
        name: 'Corte clásico',
        durationMin: 30,
        priceCents: 15000,
      },
      {
        id: 'svc-rafa-corte-barba',
        name: 'Corte + barba',
        durationMin: 45,
        priceCents: 22000,
      },
      {
        id: 'svc-rafa-afeitado',
        name: 'Afeitado de navaja',
        durationMin: 30,
        priceCents: 18000,
      },
      {
        id: 'svc-rafa-arreglo-barba',
        name: 'Arreglo de barba',
        durationMin: 15,
        priceCents: 10000,
      },
    ],
    staff: [
      {
        id: 'staff-rafa-rafa',
        name: 'Rafa Mendoza',
        role: 'Barbero principal',
        serviceIds: [
          'svc-rafa-corte-clasico',
          'svc-rafa-corte-barba',
          'svc-rafa-afeitado',
          'svc-rafa-arreglo-barba',
        ],
      },
      {
        id: 'staff-rafa-julian',
        name: 'Julián Ortiz',
        role: 'Barbero',
        serviceIds: [
          'svc-rafa-corte-clasico',
          'svc-rafa-corte-barba',
          'svc-rafa-arreglo-barba',
        ],
      },
      {
        id: 'staff-rafa-mateo',
        name: 'Mateo Vega',
        role: 'Barbero',
        serviceIds: [
          'svc-rafa-corte-clasico',
          'svc-rafa-afeitado',
          'svc-rafa-arreglo-barba',
        ],
      },
    ],
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'biz-salon-aura',
    slug: 'salon-aura',
    name: 'Salón Aura',
    category: 'salon',
    phone: '55 5209 8841',
    address: 'Colima 168, Roma Norte',
    city: 'Ciudad de México',
    // Open Mondays (short day), closed Sundays — one of the two Monday-closed
    // seeds is Don Rafa, so the calendar-disabled logic demos either way.
    hours: {
      0: null,
      1: { open: '11:00', close: '17:00' },
      2: { open: '09:30', close: '19:00' },
      3: { open: '09:30', close: '19:00' },
      4: { open: '09:30', close: '19:00' },
      5: { open: '09:30', close: '19:00' },
      6: { open: '09:30', close: '19:00' },
    },
    services: [
      {
        id: 'svc-aura-corte-peinado',
        name: 'Corte + peinado',
        durationMin: 60,
        priceCents: 38000,
      },
      {
        id: 'svc-aura-lavado-peinado',
        name: 'Lavado + peinado',
        durationMin: 45,
        priceCents: 25000,
      },
      {
        id: 'svc-aura-tinte',
        name: 'Tinte completo',
        durationMin: 120,
        priceCents: 85000,
      },
      {
        id: 'svc-aura-keratina',
        name: 'Tratamiento de keratina',
        durationMin: 90,
        priceCents: 65000,
      },
    ],
    staff: [
      {
        id: 'staff-aura-valeria',
        name: 'Valeria Ríos',
        role: 'Estilista senior',
        serviceIds: [
          'svc-aura-corte-peinado',
          'svc-aura-tinte',
          'svc-aura-keratina',
        ],
      },
      {
        id: 'staff-aura-sofia',
        name: 'Sofía Cárdenas',
        role: 'Estilista',
        serviceIds: [
          'svc-aura-corte-peinado',
          'svc-aura-lavado-peinado',
          'svc-aura-tinte',
          'svc-aura-keratina',
        ],
      },
      {
        id: 'staff-aura-mariana',
        name: 'Mariana Solís',
        role: 'Estilista',
        serviceIds: ['svc-aura-lavado-peinado', 'svc-aura-corte-peinado'],
      },
    ],
    createdAt: '2026-01-15T09:05:00.000Z',
  },
  {
    id: 'biz-spa-sereno',
    slug: 'spa-sereno',
    name: 'Spa Sereno',
    category: 'spa',
    phone: '55 8987 1040',
    address: 'Emilio Castelar 57, Polanco',
    city: 'Ciudad de México',
    hours: {
      0: { open: '10:00', close: '20:00' },
      1: { open: '10:00', close: '20:00' },
      2: { open: '10:00', close: '20:00' },
      3: { open: '10:00', close: '20:00' },
      4: { open: '10:00', close: '20:00' },
      5: { open: '10:00', close: '20:00' },
      6: { open: '10:00', close: '20:00' },
    },
    services: [
      {
        id: 'svc-sereno-masaje-relajante',
        name: 'Masaje relajante',
        durationMin: 60,
        priceCents: 65000,
      },
      {
        id: 'svc-sereno-masaje-descontracturante',
        name: 'Masaje descontracturante',
        durationMin: 75,
        priceCents: 78000,
      },
      {
        id: 'svc-sereno-facial',
        name: 'Facial hidratante',
        durationMin: 60,
        priceCents: 70000,
      },
      {
        id: 'svc-sereno-aromaterapia',
        name: 'Aromaterapia',
        durationMin: 30,
        priceCents: 40000,
      },
    ],
    staff: [
      {
        id: 'staff-sereno-diana',
        name: 'Diana Estrada',
        role: 'Terapeuta',
        serviceIds: [
          'svc-sereno-masaje-relajante',
          'svc-sereno-masaje-descontracturante',
          'svc-sereno-aromaterapia',
        ],
      },
      {
        id: 'staff-sereno-fernanda',
        name: 'Fernanda Ibáñez',
        role: 'Terapeuta principal',
        serviceIds: [
          'svc-sereno-masaje-relajante',
          'svc-sereno-masaje-descontracturante',
          'svc-sereno-facial',
          'svc-sereno-aromaterapia',
        ],
      },
      {
        id: 'staff-sereno-leon',
        name: 'León Ramírez',
        role: 'Masajista',
        serviceIds: [
          'svc-sereno-masaje-relajante',
          'svc-sereno-masaje-descontracturante',
        ],
      },
    ],
    createdAt: '2026-01-15T09:10:00.000Z',
  },
  {
    id: 'biz-estudio-unas-luna',
    slug: 'estudio-de-unas-luna',
    name: 'Estudio de Uñas Luna',
    category: 'nail-studio',
    phone: '55 6348 0917',
    address: 'Calle Alfonso Reyes 62, Condesa',
    city: 'Ciudad de México',
    // Mon–Tue closed; Wed–Sun open. Closed Mondays + open Sundays are covered
    // twice over across the four seeds.
    hours: {
      0: { open: '11:00', close: '18:00' },
      1: null,
      2: null,
      3: { open: '11:00', close: '18:00' },
      4: { open: '11:00', close: '18:00' },
      5: { open: '11:00', close: '18:00' },
      6: { open: '11:00', close: '18:00' },
    },
    services: [
      {
        id: 'svc-luna-manicure-tradicional',
        name: 'Manicure tradicional',
        durationMin: 45,
        priceCents: 25000,
      },
      {
        id: 'svc-luna-manicure-gel',
        name: 'Manicure en gel',
        durationMin: 75,
        priceCents: 45000,
      },
      {
        id: 'svc-luna-pedicure-spa',
        name: 'Pedicure spa',
        durationMin: 60,
        priceCents: 38000,
      },
      {
        id: 'svc-luna-unas-acrilicas',
        name: 'Uñas acrílicas',
        durationMin: 90,
        priceCents: 60000,
      },
    ],
    staff: [
      {
        id: 'staff-luna-luna',
        name: 'Luna Trejo',
        role: 'Nail artist principal',
        serviceIds: [
          'svc-luna-manicure-tradicional',
          'svc-luna-manicure-gel',
          'svc-luna-pedicure-spa',
        ],
      },
      {
        id: 'staff-luna-camila',
        name: 'Camila Duarte',
        role: 'Manicurista',
        serviceIds: ['svc-luna-manicure-tradicional', 'svc-luna-pedicure-spa'],
      },
      {
        id: 'staff-luna-renata',
        name: 'Renata Aguilar',
        role: 'Nail artist',
        serviceIds: [
          'svc-luna-manicure-gel',
          'svc-luna-unas-acrilicas',
          'svc-luna-pedicure-spa',
        ],
      },
    ],
    createdAt: '2026-01-15T09:15:00.000Z',
  },
];
