// ============================================
// FILE: prisma/seed.ts
// PURPOSE: Seeds database with realistic test data including tracking history
// DEPENDENCIES: prisma, bcrypt
// ============================================

import { PrismaClient, Area, Status } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================
// HELPERS
// ============================================

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const areas: Area[] = ['KNOWLEDGE', 'PASSIVE', 'ACTIVE'];
const statuses: Status[] = ['WAITING', 'ACTIVE', 'PAUSED'];

const actionNames = [
  'Implement Auth', 'Document API', 'Optimize Query',
  'Refactor Component', 'Write Tests', 'Configure CI/CD',
  'Create UI Design', 'Analyze Logs', 'Migrate Database',
  'Configure Monitoring', 'Create Backup Strategy', 'Optimize Load Time',
];

const benefits = [
  'Improved security', 'Better performance', 'Increased maintainability',
  'Enhanced UX', 'Reduced errors', 'Increased scalability',
];

const stepDescriptions = [
  'Analyze requirements', 'Create concept', 'Implement',
  'Test', 'Review', 'Deploy', 'Setup monitoring',
];

const essenceTexts = [
  'Migrating authentication to JWT-based system to optimize sessions.',
  'Extending API documentation with OpenAPI and auto-generating it.',
  'Accelerating database queries through indexes and caching.',
  'Breaking down components into smaller, reusable pieces.',
  'Adding tests for critical paths and integrating with CI/CD.',
  'Migrating deployment to GitHub Actions with full automation.',
  'Auditing UI for accessibility and optimizing it.',
  'Centralizing logs and visualizing them with dashboards.',
  'Upgrading database to the latest version.',
  'Expanding monitoring with Grafana and Prometheus.',
];

const trackingNotes = [
  'Initial creation',
  'Progress update',
  'Blocked by dependency',
  'Waiting for review',
  'Deployed to staging',
  'Deployed to production',
  'Rolled back',
  'Refined requirements',
];

// ============================================
// SEED MAIN
// ============================================

async function main() {
  console.log('🌱 Starting seeding...');

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

  // 2. 30 Topics
  const topicNames = [
    'Backend', 'Frontend', 'DevOps', 'Database', 'Security',
    'UI/UX', 'Testing', 'Documentation', 'Monitoring', 'Performance',
    'Architecture', 'API', 'Caching', 'Logging', 'CI/CD',
    'Container', 'Cloud', 'Network', 'Data Analytics', 'AI/ML',
    'Mobile', 'Desktop', 'Embedded', 'IoT', 'Blockchain',
    'Game Dev', 'AR/VR', 'DevTools', 'Open Source', 'Community',
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
  console.log(`✅ ${topics.length} Topics created`);

  // 3. Generate entries with tracking history
  let totalEntries = 0;

  for (let tIdx = 0; tIdx < topics.length; tIdx++) {
    const topic = topics[tIdx];
    const isBigTopic = tIdx === 0;
    const entryCount = isBigTopic ? 120 : Math.floor(Math.random() * 6) + 5;

    for (let i = 0; i < entryCount; i++) {
      const area = randomItem(areas);
      const status = randomItem(statuses);
      const hasSteps = area === 'ACTIVE';
      const stepCount = hasSteps ? Math.floor(Math.random() * 4) + 1 : 0;

      const pauseReason =
        status === 'WAITING'
          ? randomItem(['Waiting for approval', 'Blocked by dependency', 'Priority shifted'])
          : undefined;

      const isFavorite = Math.random() > 0.7;

      // Entry base date: random within last 30 days
      const baseDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

      // Generate steps with proper currentStepIndex bounds
      const steps = hasSteps
        ? Array.from({ length: stepCount }, (_, idx) => ({
            order: idx,
            description: randomItem(stepDescriptions) + ` (Step ${idx + 1})`,
          }))
        : undefined;

      const currentStepIndex = hasSteps && stepCount > 0
        ? Math.floor(Math.random() * stepCount)
        : 0;

      // ============================================
      // CREATE ENTRY
      // ============================================
      const entry = await prisma.entry.create({
        data: {
          essenceText: randomItem(essenceTexts) + ` (Topic: ${topic.name}, #${i + 1})`,
          essenceShort: randomItem(actionNames).slice(0, 30),
          area,
          actionName: area !== 'KNOWLEDGE' ? randomItem(actionNames) : undefined,
          benefit: area !== 'KNOWLEDGE' ? randomItem(benefits) : undefined,
          status: area !== 'KNOWLEDGE' ? status : undefined,
          pauseReason,
          steps,
          currentStepIndex,
          isFavorite,
          topicId: topic.id,
          userId: admin.id,
          createdAt: baseDate,
          updatedAt: new Date(baseDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });

      // ============================================
      // GENERATE TRACKING LOGS
      // ============================================
      const trackings: {
        entryId: number;
        trackingType: string;
        timestamp: Date;
        oldStatus?: Status;
        newStatus?: Status;
        previousStep?: string;
        newStep?: string;
        note?: string;
      }[] = [];

      // 1. CREATION (always)
      trackings.push({
        entryId: entry.id,
        trackingType: 'CREATION',
        timestamp: new Date(baseDate.getTime() + Math.random() * 60 * 60 * 1000),
        note: randomItem(trackingNotes),
      });

      // 2. STATUS_CHANGE (if area !== KNOWLEDGE)
      if (area !== 'KNOWLEDGE' && Math.random() > 0.3) {
        const oldStatus = randomItem(statuses.filter(s => s !== status));
        trackings.push({
          entryId: entry.id,
          trackingType: 'STATUS_CHANGE',
          timestamp: new Date(baseDate.getTime() + (1 + Math.random() * 3) * 24 * 60 * 60 * 1000),
          oldStatus,
          newStatus: status,
          note: randomItem(['Status update', 'Progress made', 'Blocked resolved']),
        });
      }

      // 3. STEP_CHANGE (if ACTIVE and has steps)
      if (area === 'ACTIVE' && stepCount > 0 && currentStepIndex > 0 && Math.random() > 0.4) {
        const prevStep = steps?.[currentStepIndex - 1]?.description || 'Initial';
        const newStep = steps?.[currentStepIndex]?.description || 'Current';
        trackings.push({
          entryId: entry.id,
          trackingType: 'STEP_CHANGE',
          timestamp: new Date(baseDate.getTime() + (2 + Math.random() * 5) * 24 * 60 * 60 * 1000),
          previousStep: prevStep,
          newStep: newStep,
          note: randomItem(['Step completed', 'Progressing to next step']),
        });
      }

      // 4. MANUAL (random, 20% chance)
      if (Math.random() > 0.8) {
        trackings.push({
          entryId: entry.id,
          trackingType: 'MANUAL',
          timestamp: new Date(baseDate.getTime() + (3 + Math.random() * 10) * 24 * 60 * 60 * 1000),
          note: randomItem(['Manual progress log', 'Offline work recorded']),
        });
      }

      // 5. ENTRY_EDIT (if updatedAt > createdAt)
      if (entry.updatedAt > entry.createdAt && Math.random() > 0.5) {
        trackings.push({
          entryId: entry.id,
          trackingType: 'ENTRY_EDIT',
          timestamp: entry.updatedAt,
          note: randomItem(['Entry updated', 'Content refined', 'Details added']),
        });
      }

      // ✅ FIX: Bulk insert with proper undefined filtering
      if (trackings.length > 0) {
        await prisma.tracking.createMany({
          data: trackings.map((t) => {
            const cleaned: any = {
              entryId: t.entryId,
              trackingType: t.trackingType,
              timestamp: t.timestamp,
            };
            if (t.note) cleaned.note = t.note;
            if (t.oldStatus) cleaned.oldStatus = t.oldStatus;
            if (t.newStatus) cleaned.newStatus = t.newStatus;
            if (t.previousStep) cleaned.previousStep = t.previousStep;
            if (t.newStep) cleaned.newStep = t.newStep;
            return cleaned;
          }),
        });
      }

      totalEntries++;
    }

    console.log(
      `   📂 ${topic.name}: ${entryCount} entries${isBigTopic ? ' 🚀 (Performance Test)' : ''}`
    );
  }

  console.log(`✅ ${totalEntries} total entries created with tracking history`);
  console.log('🌱 Seeding completed.');
}

// ============================================
// EXECUTION
// ============================================

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });