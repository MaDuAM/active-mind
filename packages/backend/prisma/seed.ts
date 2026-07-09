import { PrismaClient, Area, Status } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================
// Hilfsfunktionen für realistische Daten
// ============================================

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const areas: Area[] = ['KNOWLEDGE', 'PASSIVE', 'ACTIVE'];
const statuses: Status[] = ['WAITING', 'ACTIVE', 'PAUSED'];

const actionNames = [
  'Implementiere Auth', 'Dokumentiere API', 'Optimiere Query',
  'Refaktorisiere Komponente', 'Schreibe Tests', 'Konfiguriere CI/CD',
  'Erstelle UI-Design', 'Analysiere Logs', 'Migriere Datenbank',
  'Konfiguriere Monitoring', 'Erstelle Backup-Strategie', 'Optimiere Ladezeit',
];

const benefits = [
  'Sicherheit erhöht', 'Performance verbessert', 'Wartbarkeit gesteigert',
  'Nutzererfahrung verbessert', 'Fehler reduziert', 'Skalierbarkeit erhöht',
];

const stepDescriptions = [
  'Anforderungen analysieren', 'Konzept erstellen', 'Implementieren',
  'Testen', 'Review durchführen', 'Deployen', 'Monitoring einrichten',
];

const essenceTexts = [
  'Die Authentifizierung wird auf JWT-Basis umgestellt, um Sitzungen zu optimieren.',
  'Die API-Dokumentation wird mit OpenAPI erweitert und automatisch generiert.',
  'Die Datenbankabfragen werden durch Indizes und Caching beschleunigt.',
  'Die Komponente wird in kleinere, wiederverwendbare Teile zerlegt.',
  'Tests werden für kritische Pfade hinzugefügt und mit CI/CD verknüpft.',
  'Das Deployment wird auf GitHub Actions umgestellt und automatisiert.',
  'Das UI wird auf Barrierefreiheit geprüft und optimiert.',
  'Die Logs werden zentral gesammelt und visualisiert.',
  'Die Datenbank wird auf die neueste Version migriert.',
  'Das Monitoring wird mit Grafana und Prometheus ausgebaut.',
];

// ============================================
// Seed Hauptfunktion
// ============================================

async function main() {
  console.log('🌱 Starte Seeding...');

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 10),
    },
  });
  console.log(`✅ Admin User: ${admin.username}`);

  // 2. 30 Topics erstellen
  const topicNames = [
    'Backend', 'Frontend', 'DevOps', 'Datenbank', 'Sicherheit',
    'UI/UX', 'Tests', 'Dokumentation', 'Monitoring', 'Performance',
    'Architektur', 'API', 'Caching', 'Logging', 'CI/CD',
    'Container', 'Cloud', 'Netzwerk', 'Datenanalyse', 'KI/Machine Learning',
    'Mobile', 'Desktop', 'Embedded', 'IoT', 'Blockchain',
    'Game Development', 'AR/VR', 'DevTools', 'Open Source', 'Community',
  ];

  const topics = [];
  for (const name of topicNames) {
    const topic = await prisma.topic.upsert({
      where: { userId_name: { userId: admin.id, name } },
      update: {},
      create: { name, userId: admin.id },
    });
    topics.push(topic);
  }
  console.log(`✅ ${topics.length} Topics erstellt`);

  // 3. Für jedes Topic Einträge generieren
  let totalEntries = 0;

  for (let tIdx = 0; tIdx < topics.length; tIdx++) {
    const topic = topics[tIdx];
    const isBigTopic = tIdx === 0; // Erstes Topic = Performance-Test
    const entryCount = isBigTopic ? 120 : Math.floor(Math.random() * 6) + 5; // 5-10 oder 120

    for (let i = 0; i < entryCount; i++) {
      const area = randomItem(areas);
      const status = randomItem(statuses);
      const hasSteps = area === 'ACTIVE';
      const stepCount = hasSteps ? Math.floor(Math.random() * 4) + 1 : 0;

      // Pause Reason nur bei WAITING
      const pauseReason =
        status === 'WAITING'
          ? randomItem(['Warte auf Freigabe', 'Blockiert durch Abhängigkeit', 'Priorität verschoben'])
          : undefined;

      // Favoriten: 30% Chance auf Favorite
      const isFavorite = Math.random() > 0.7;

      await prisma.entry.create({
        data: {
          essenceText: randomItem(essenceTexts) + ` (Topic: ${topic.name}, Nr. ${i + 1})`,
          essenceShort: `${randomItem(actionNames).slice(0, 30)}...`,
          area,
          actionName: area !== 'KNOWLEDGE' ? randomItem(actionNames) : undefined,
          benefit: area !== 'KNOWLEDGE' ? randomItem(benefits) : undefined,
          status: area !== 'KNOWLEDGE' ? status : undefined,
          pauseReason,
          steps: hasSteps
            ? Array.from({ length: stepCount }, (_, idx) => ({
                order: idx,
                description: randomItem(stepDescriptions) + ` (Step ${idx + 1})`,
              }))
            : undefined,
          currentStepIndex: hasSteps ? Math.floor(Math.random() * stepCount) : 0,
          isFavorite, // NEU
          topicId: topic.id,
          userId: admin.id,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      });
      totalEntries++;
    }

    console.log(
      `   📂 ${topic.name}: ${entryCount} Einträge${isBigTopic ? ' 🚀 (Performance-Test)' : ''}`
    );
  }

  console.log(`✅ ${totalEntries} Einträge insgesamt erstellt`);
  console.log('🌱 Seeding abgeschlossen.');
}

// ============================================
// Ausführung
// ============================================

main()
  .catch((e) => {
    console.error('❌ Fehler beim Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });