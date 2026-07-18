import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yorha_portfolio';

console.log('[DATABASE] Connecting to MongoDB...');
// 30s (the mongoose default) rather than an aggressive 5s: the initial Atlas
// handshake (SRV lookup + TLS to each shard + replica-set discovery + auth) can
// exceed 5s on high-latency/jittery links (e.g. mobile tethering), which
// otherwise surfaces as a misleading "IP not whitelisted" server-selection error.
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 })
  .then(() => console.log('[DATABASE] MongoDB connection established successfully.'))
  .catch(err => console.error('[DATABASE] ERROR: Connection failed:', err.message));

const schemaOptions = {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  versionKey: false
};

// ─── Post Schema ─────────────────────────────────────────────────────────────
const PostSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  category: String,
  date: String,
  readTime: String,
  summary: String,
  status: { type: String, default: 'published' },
  tags: [String],
  slug: String,
  content: String
}, schemaOptions);

// ─── Project Schema ──────────────────────────────────────────────────────────
const ProjectSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  techStack: [String],
  githubUrl: String,
  demoUrl: String,
  imageUrl: String,
  order: Number,
  featured: { type: Boolean, default: false },
  visibility: { type: String, default: 'visible' }
}, schemaOptions);

// ─── Media Schema ────────────────────────────────────────────────────────────
const MediaSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  url: String,
  size: Number,
  type: String,
  uploadedAt: String
}, schemaOptions);

// ─── Setting Schema ──────────────────────────────────────────────────────────
const SettingSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // 'settings-global'
  pfpUrl: { type: String, default: '/pfp.png' },
  lastBackup: { type: String, default: 'NEVER RECORDED' }
}, schemaOptions);

// ─── Log Schema ──────────────────────────────────────────────────────────────
const LogSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // 'log-timestamp'
  timestamp: String,
  module: String,
  message: String,
  isAlert: { type: Boolean, default: false }
}, schemaOptions);

// ─── Auth Schema ─────────────────────────────────────────────────────────────
const AuthSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // 'auth-global'
  isInitialized: { type: Boolean, default: false },
  adminPasswordHash: { type: String, default: '' }
}, schemaOptions);

// ─── Otaku Record Schema ─────────────────────────────────────────────────────
const OtakuRecordSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, default: 'Anime' },
  rating: Number,
  existentialThreat: Number,
  note: String,
  coverUrl: String,
  kitsuUrl: String,
  tags: [String],
  accentColor: String
}, schemaOptions);

export const Post = mongoose.model('Post', PostSchema);
export const Project = mongoose.model('Project', ProjectSchema);
export const Media = mongoose.model('Media', MediaSchema);
export const Setting = mongoose.model('Setting', SettingSchema);
export const Log = mongoose.model('Log', LogSchema);
export const Auth = mongoose.model('Auth', AuthSchema);
export const OtakuRecord = mongoose.model('OtakuRecord', OtakuRecordSchema);

// Seed default databases on server boot if they are empty
export async function seedDatabase() {
  try {
    const postCount = await Post.countDocuments();
    if (postCount === 0) {
      console.log('[DATABASE] Seeding default blog posts...');
      await Post.insertMany([
        {
          _id: 'post-atcoder-dp',
          title: 'AtCoder DP Contest Editorial',
          category: 'ALGORITHMS',
          date: '2021-04-22',
          readTime: '15 min read',
          summary: 'An editorial for the dynamic programming problems contained in the AtCoder DP Contest, with detailed transition equations and C++ code implementations.',
          status: 'published',
          tags: ['competitive programming', 'dp'],
          slug: 'atcoder-dp-editorial',
          content: `# Introduction\n\nThis post contains the editorials for all tasks contained in the [AtCoder DP Contest](https://atcoder.jp/contests/dp/tasks), since there is no official editorial.\n\n## [A - Frog 1](https://atcoder.jp/contests/dp/tasks/dp_a)\n\n**Time Complexity:** $\\mathcal{O}(N)$\n\nUse dynamic programming and define $\\texttt{dp}[i]$ as the minimum cost to reach stone $i$. Then, there are only two transitions:\n\n- Jump one stone:\n  $$\\texttt{dp}[i + 1] = \\min(\\texttt{dp}[i + 1], \\texttt{dp}[i] + |\\texttt{A}[i] - \\texttt{A}[i + 1]|)$$\n\n- Jump two stones:\n  $$\\texttt{dp}[i + 2] = \\min_{0 \\le i + j < N}(\\texttt{dp}[i + 2], \\texttt{dp}[i] + |\\texttt{A}[i] - \\texttt{A}[i + 2]|)$$\n\n\`\`\`cpp\n#include <bits/stdc++.h>\nusing namespace std;\nconst int mx = 1e5+1;\nint A[mx], dp[mx];\nint main() {\n\tcin.tie(0)->sync_with_stdio(0);\n\tint N; cin >> N;\n\tfor(int i = 0; i < N; ++i) {\n\t\tcin >> A[i];\n\t\tdp[i] = 1e9 + 7;\n\t}\n\tdp[0] = 0;\n\tfor(int i = 0; i < N; ++i) {\n\t\tif(i + 1 < N) dp[i + 1] = min(dp[i + 1], dp[i] + abs(A[i] - A[i + 1]));\n\t\tif(i + 2 < N) dp[i + 2] = min(dp[i + 2], dp[i] + abs(A[i] - A[i + 2]));\n\t}\n\tcout << dp[N - 1] << endl;\n}\n\`\`\`\n\n## [B - Frog 2](https://atcoder.jp/contests/dp/tasks/dp_b)\n\n**Time Complexity:** $\\mathcal{O}(NK)$\n\nThis is the exact same problem as Frog 1, just with variable distances. Simply loop through each of the possible jumps, and use the previous transition where $\\texttt{dp}[i]$ represents the best value for stone $i$.\n\n$$\\texttt{dp}[i + j] = \\min_{0 \\le i + j < N}(\\texttt{dp}[i + j], \\texttt{dp}[i] + |\\texttt{A}[i] - \\texttt{A}[i + j]|)$$\n\n\`\`\`cpp\n#include <bits/stdc++.h>\nusing namespace std;\nconst int mx = 1e5+1;\nint A[mx], dp[mx];\nint main() {\n\tcin.tie(0)->sync_with_stdio(0);\n\tint N, K; cin >> N >> K;\n\tfor(int i = 0; i < N; ++i) {\n\t\tcin >> A[i];\n\t\tdp[i] = 1e9 + 7;\n\t}\n\tdp[0] = 0;\n\tfor(int i = 0; i < N; ++i) {\n\t\tfor(int j = 1; j <= K; ++j) {\n\t\t\tif(i + j < N) dp[i + j] = min(dp[i + j], dp[i] + abs(A[i] - A[i + j]));\n\t\t}\n\t}\n\tcout << dp[N - 1] << endl;\n}\n\`\`\``
        },
        {
          _id: 'post-1',
          title: 'Algorithms in Game Design // Graph Traversals in YoRHa Modules',
          category: 'ALGORITHMS',
          date: '2026-07-09',
          readTime: '6 min read',
          summary: 'An analysis of graph theory, grid traversal optimizations (like Dijkstra and A*), and how tactical HUD displays utilize scan lines for fast routing matrices.',
          status: 'published',
          tags: ['algorithms', 'pathfinding'],
          slug: 'graph-traversals-yorha',
          content: `## System Initialization: Graph Traversal\n\nIn modern tactical grid engines, representing spatial architectures efficiently is paramount. A standard 2D layout (like a map matrix) is modeled as a grid graph $G = (V, E)$, where each grid cell represents a vertex $v \\in V$, and edges $e \\in E$ represent paths to adjacent cells.\n\n### Grid Scan and Dijkstra Node Computations\n\nUsing Dijkstra's algorithm allows the unit to find the shortest path from node $S$ to $T$ on a grid with weights representing terrain difficulties (e.g., enemy barriers, water obstacles). The priority queue evaluates vertices based on:\n\n$$d(v) = \\min \\{ d(u) + w(u, v) \\}$$\n\n\`\`\`typescript\n// Dijkstra Node Scan Structure\ninterface Node {\n  row: number;\n  col: number;\n  distance: number;\n  isVisited: boolean;\n  previousNode: Node | null;\n}\n\`\`\`\n\nBy scanning cells radially, YoRHa units can dynamically re-compute routes in real-time when blocking obstacles are placed in the environment.\n\n### Optimization Matrix\n\n1. **Binary Heaps**: Reduces queue search complexity from $O(V)$ to $O(\\log V)$.\n2. **Scan Filters**: Halts expansions once target node $T$ is marked as visited, saving up to 40% memory cycles.`
        },
        {
          _id: 'post-2',
          title: 'CSS Architecture // Recreating YoRHa UI Grids & Scanning Elements',
          category: 'SOFTWARE',
          date: '2026-06-30',
          readTime: '4 min read',
          summary: 'A look behind the stylesheets. Learn how custom gradients, keyframe animations, scanline bars, and subtle grain effects are orchestrated to produce premium retro digital interfaces.',
          status: 'published',
          tags: ['css', 'frontend'],
          slug: 'css-architecture-yorha',
          content: `## The Anatomy of YoRHa UI\n\nThe UI design of NieR: Automata is celebrated for its elegance, tactical responsiveness, and beige color schemes. Achieving this in a modern browser requires standard Vanilla CSS and custom CSS variables.\n\n### The Dotted Grid Overlay\n\nTo give a page a military-grade CRT screen look, we overlay a repeating radial gradient. This generates fine, subtle background dots:\n\n\`\`\`css\n.nier-grid-overlay {\n  background-image: \n    radial-gradient(var(--nier-grid-line) 1px, transparent 1px);\n  background-size: 20px 20px;\n}\n\`\`\`\n\n### Scanline Scrolling Animations\n\nA linear gradient combined with a slow vertical keyframe animation mimics screen scan refreshes. We keep opacity very low (around 3%) to ensure readability is not compromised:\n\n\`\`\`css\n@keyframes scan {\n  0% { top: -100px; }\n  100% { top: 100%; }\n}\n\`\`\`\n\n### Key Stylings to Keep in Mind\n\n- **Monospace Text**: Use \`Share Tech Mono\` for numerical lists and stat callouts.\n- **Micro-Glitches**: Inject slight pixel transformations on buttons when hovered to suggest mechanical interference.`
        },
        {
          _id: 'post-3',
          title: 'Otaku Analysis // The Cybernetic Despair of Serial Experiments Lain',
          category: 'ART & CULTURE',
          date: '2026-06-15',
          readTime: '8 min read',
          summary: 'Exploring the philosophical constructs, wire matrices, and identity breakdowns inside the classic 1998 cyberpunk masterpiece Serial Experiments Lain.',
          status: 'published',
          tags: ['anime', 'philosophy'],
          slug: 'cybernetic-despair-lain',
          content: `## Welcome to the Wired\n\n*Serial Experiments Lain* (1998) stands as one of the most prescient anime series ever created. It explores the blurred boundaries between the physical world (The Real World) and the digital network (The Wired).\n\n### Identity and the Collective Consciousness\n\nLain Iwakura's journey shows the devolution of physical selfhood into omnipotent digital matrices. The series poses several core questions:\n- *Is physical presence a requirement for existence?*\n- *Can memories exist independently of human brains?*\n- *Does the network constitute a new godhead?*\n\n### Visual Language\n\nThe series uses ambient noise, humming power lines, and sharp contrasting shadows. This aesthetic directly matches the desolation and post-humanism found in the NieR ruins. The power line hum represents the constant, inescapable voice of the Wired.`
        }
      ]);
    }

    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      console.log('[DATABASE] Seeding default projects catalog...');
      await Project.insertMany([
        {
          _id: 'proj-medisense',
          title: 'MediSense // AI Diagnostics Portal',
          description: 'An AI-driven diagnostic engine developed to accelerate early condition detections (e.g. lung cancer, pneumonia) from CT scans and MRI imaging files using CNN filters.',
          techStack: ['LLM', 'TensorFlow', 'OpenCV', 'React', 'Node.js', 'Flask', 'MongoDB'],
          githubUrl: 'https://github.com/hitarth-gg/MediSense',
          demoUrl: '',
          imageUrl: '',
          order: 1,
          featured: true,
          visibility: 'visible'
        },
        {
          _id: 'proj-cphelper',
          title: 'CP-Helper // Algorithmic Toolkit',
          description: 'An all-in-one platform for competitive programmers offering modular arithmetic tools, an interactive D3.js graph visualizer, and beginner guides serving 1,000+ programmers.',
          techStack: ['React', 'Node.js', 'Express', 'Tailwind CSS', 'Codeforces API', 'D3.js'],
          githubUrl: 'https://github.com/sarthaknayyar/cp-helper',
          demoUrl: 'https://github.com/sarthaknayyar/cp-helper',
          imageUrl: '',
          order: 2,
          featured: true,
          visibility: 'visible'
        },
        {
          _id: 'proj-jansunwai',
          title: 'JansunwAI // Grievance Classifier',
          description: 'Simplified grievance processing utility utilizing local Ollama-DeepSeek LLM structures and AssemblyAI speech-to-text recognition modules for regional language query indexing.',
          techStack: ['MongoDB', 'Express', 'React', 'Node.js', 'Ollama', 'DeepSeek', 'AssemblyAI'],
          githubUrl: 'https://github.com/datmedevil17/jansunwAI',
          demoUrl: '',
          imageUrl: '',
          order: 3,
          featured: false,
          visibility: 'visible'
        }
      ]);
    }

    const mediaCount = await Media.countDocuments();
    if (mediaCount === 0) {
      console.log('[DATABASE] Seeding default media references...');
      await Media.insertMany([
        {
          _id: 'media-1',
          name: 'YoRHa_Main_Visual.jpg',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
          size: 245,
          type: 'image/jpeg',
          uploadedAt: '2026-07-09'
        },
        {
          _id: 'media-2',
          name: 'System_Maintenance_Nodes.png',
          url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
          size: 512,
          type: 'image/png',
          uploadedAt: '2026-07-08'
        }
      ]);
    }

    const settingCount = await Setting.countDocuments();
    if (settingCount === 0) {
      console.log('[DATABASE] Seeding global settings document...');
      await Setting.create({
        _id: 'settings-global',
        pfpUrl: '/pfp.png',
        lastBackup: 'NEVER RECORDED'
      });
    }

    const authCount = await Auth.countDocuments();
    if (authCount === 0) {
      console.log('[DATABASE] Seeding security credentials database...');
      await Auth.create({
        _id: 'auth-global',
        isInitialized: false,
        adminPasswordHash: ''
      });
    }

    const otakuCount = await OtakuRecord.countDocuments();
    if (otakuCount === 0) {
      console.log('[DATABASE] Seeding default Otaku records...');
      await OtakuRecord.insertMany([
        {
          _id: 'otaku-lain',
          title: 'Serial Experiments Lain',
          type: 'Anime',
          rating: 10,
          existentialThreat: 9.5,
          note: 'Peak cyber-punk philosophy and terminal diagnostics. Lain is everywhere.',
          coverUrl: 'https://media.kitsu.app/anime/poster_images/306/medium.jpg',
          kitsuUrl: 'https://kitsu.io/anime/serial-experiments-lain',
          tags: ['PSYCHOLOGICAL', 'CYBERPUNK', 'MASTERPIECE', 'ESSENTIAL'],
          accentColor: 'hsl(210, 30%, 50%)'
        },
        {
          _id: 'otaku-eva',
          title: 'Neon Genesis Evangelion',
          type: 'Anime',
          rating: 10,
          existentialThreat: 10,
          note: 'Deep psychological machinery and existential core. End of Evangelion is a war crime on your emotions.',
          coverUrl: 'https://media.kitsu.app/anime/21/poster_image/medium-d98a2928c9eda0d71f0dab72c1a0124d.jpeg',
          kitsuUrl: 'https://kitsu.io/anime/neon-genesis-evangelion',
          tags: ['PSYCHOLOGICAL', 'MECHA', 'TRAUMA_CORE', 'MASTERPIECE'],
          accentColor: 'hsl(160, 28%, 44%)'
        },
        {
          _id: 'otaku-nier',
          title: 'NieR: Automata Ver1.1a',
          type: 'Anime',
          rating: 9,
          existentialThreat: 8,
          note: 'Gorgeous anime adaptation of the YoRHa narrative. Appropriately running this very OS.',
          coverUrl: 'https://media.kitsu.app/anime/47784/poster_image/medium-87164c01153374979cbb13368c4635a1.jpeg',
          kitsuUrl: 'https://kitsu.io/anime/nier-automata-ver11a',
          tags: ['SCI-FI', 'YORHA_LORE', 'ACTION', 'EMOTIONAL'],
          accentColor: 'hsl(38, 35%, 48%)'
        },
        {
          _id: 'otaku-sg',
          title: 'Steins;Gate',
          type: 'Anime',
          rating: 9.5,
          existentialThreat: 7,
          note: 'Time travel, loop theories, and worldline matrices. Episode 22 destroyed me.',
          coverUrl: 'https://media.kitsu.app/anime/poster_images/5646/medium.jpg',
          kitsuUrl: 'https://kitsu.io/anime/steins-gate',
          tags: ['SCI-FI', 'TIME_TRAVEL', 'THRILLER', 'REWATCH'],
          accentColor: 'hsl(275, 28%, 48%)'
        }
      ]);
    }
    console.log('[DATABASE] Seeding integrity check completed successfully.');
  } catch (err) {
    console.error('[DATABASE] Seed checks failed:', err.message);
  }
}
