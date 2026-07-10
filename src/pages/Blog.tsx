import React, { useEffect, useState } from 'react';
import { Sound } from '../components/SoundController';
import { BookOpen, Edit3, Settings, Save, Trash2, Download, Upload, Clock } from 'lucide-react';
import { marked } from 'marked';
import katex from 'katex';
import hljs from 'highlight.js';

// Setup marked code block custom renderer for YoRHa style and highlight.js integration
const renderer = {
  code(firstArg: any, secondArg?: any) {
    // Handle both old marked signature (code, lang) and new marked signature ({ text, lang })
    let text = '';
    let lang = 'plaintext';
    if (typeof firstArg === 'object' && firstArg !== null) {
      text = firstArg.text || '';
      lang = firstArg.lang || 'plaintext';
    } else {
      text = firstArg || '';
      lang = secondArg || 'plaintext';
    }

    let highlighted = text;
    try {
      if (hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(text, { language: lang }).value;
      } else {
        highlighted = hljs.highlightAuto(text).value;
      }
    } catch (err) {
      console.warn(err);
    }

    // Safely encode text for the copy button click handler to prevent quote syntax breakage
    const escapedText = encodeURIComponent(text);

    return `
      <div class="code-block-container" style="margin: 18px 0; border: 1px solid var(--nier-border); background-color: rgba(0,0,0,0.03); box-shadow: 1px 1px 0px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; background-color: var(--nier-bg-alt); padding: 4px 10px; font-size: 11px; font-family: var(--font-mono); border-bottom: 1px solid var(--nier-border-muted);">
          <span>CODE_MODULE // ${lang.toUpperCase()}</span>
          <button 
            class="nier-btn small" 
            style="padding: 2px 6px; font-size: 9px; cursor: pointer;"
            onclick="navigator.clipboard.writeText(decodeURIComponent('${escapedText}')).then(() => { this.textContent = '[ COPIED ]'; setTimeout(() => this.textContent = '[ COPY ]', 1500); }).catch(() => { this.textContent = '[ COPIED ]'; setTimeout(() => this.textContent = '[ COPY ]', 1500); });"
          >
            [ COPY ]
          </button>
        </div>
        <pre style="padding: 12px; margin: 0; overflow-x: auto; font-family: var(--font-mono); font-size: 13px; text-align: left; line-height: 1.4; white-space: pre;"><code class="hljs language-${lang}">${highlighted}</code></pre>
      </div>
    `;
  }
};

marked.use({ renderer });

// Math preprocessor using KaTeX
const preprocessMath = (text: string): string => {
  let temp = text;

  // 1. Process block math $$ ... $$
  temp = temp.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return `<div class="katex-block-wrapper" style="margin: 18px 0; text-align: center; overflow-x: auto; overflow-y: hidden; width: 100%;">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch (err) {
      return `<div class="katex-error" style="color: var(--nier-accent);">${math}</div>`;
    }
  });

  // 2. Process inline math $ ... $
  temp = temp.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch (err) {
      return `<span class="katex-error" style="color: var(--nier-accent);">${math}</span>`;
    }
  });

  return temp;
};

// Render full markdown to HTML
const renderMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  const preprocessed = preprocessMath(markdown);
  return marked.parse(preprocessed, { async: false }) as string;
};

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  summary: string;
  content: string;
}

const DEFAULT_POSTS: BlogPost[] = [
  {
    id: "post-atcoder-dp",
    title: "AtCoder DP Contest Editorial",
    category: "ALGORITHMS",
    date: "2021-04-22",
    readTime: "15 min read",
    summary: "An editorial for the dynamic programming problems contained in the AtCoder DP Contest, with detailed transition equations and C++ code implementations.",
    content: `# Introduction

This post contains the editorials for all tasks contained in the
[AtCoder DP Contest](https://atcoder.jp/contests/dp/tasks), since there is no
official editorial.

## [A - Frog 1](https://atcoder.jp/contests/dp/tasks/dp_a)

**Time Complexity:** \$\mathcal{O}(N)\$

Use dynamic programming and define \$\texttt{dp}[i]\$ as the minimum cost to reach
stone \$i\$. Then, there are only two transitions:

- Jump one stone:

  \$\$
  \texttt{dp}[i + 1] = \min(\texttt{dp}[i + 1], \texttt{dp}[i] + |\texttt{A}[i] - \texttt{A}[i + 1]|)
  \$\$

- Jump two stones:
  \$\$
  \texttt{dp}[i + 2] = \min_{0 \le i + j < N}(\texttt{dp}[i + 2], \texttt{dp}[i] + |\texttt{A}[i] - \texttt{A}[i + 2]|)
  \$\$

\`\`\`cpp
#include <bits/stdc++.h>

using namespace std;

const int mx = 1e5+1;

int A[mx], dp[mx];

int main() {
	cin.tie(0)->sync_with_stdio(0);

	int N; cin >> N;

	for(int i = 0; i < N; ++i) {
		cin >> A[i];
		dp[i] = 1e9 + 7;
	}

	dp[0] = 0;

	for(int i = 0; i < N; ++i) {
		if(i + 1 < N) dp[i + 1] = min(dp[i + 1], dp[i] + abs(A[i] - A[i + 1]));
		if(i + 2 < N) dp[i + 2] = min(dp[i + 2], dp[i] + abs(A[i] - A[i + 2]));
	}

	cout << dp[N - 1] << endl;
}
\`\`\`

## [B - Frog 2](https://atcoder.jp/contests/dp/tasks/dp_b)

**Time Complexity:** \$\mathcal{O}(NK)\$

This is the exact same problem as Frog 1, just with variable distances. Simply
loop through each of the possible jumps, and use the previous transition where
\$\texttt{dp}[i]\$ represents the best value for stone \$i\$.

\$\$
\texttt{dp}[i + j] = \min_{0 \le i + j < N}(\texttt{dp}[i + j], \texttt{dp}[i] + |\texttt{A}[i] - \texttt{A}[i + j]|)
\$\$

\`\`\`cpp
#include <bits/stdc++.h>

using namespace std;

const int mx = 1e5+1;

int A[mx], dp[mx];

int main() {
	cin.tie(0)->sync_with_stdio(0);

	int N, K; cin >> N >> K;

	for(int i = 0; i < N; ++i) {
		cin >> A[i];
		dp[i] = 1e9 + 7;
	}

	dp[0] = 0;

	for(int i = 0; i < N; ++i) {
		for(int j = 1; j <= K; ++j) { // j is jump
			if(i + j < N) dp[i + j] = min(dp[i + j], dp[i] + abs(A[i] - A[i + j]));
		}
	}

	cout << dp[N - 1] << endl;
}
\`\`\`

## [C - Vacation](https://atcoder.jp/contests/dp/tasks/dp_c)

**Time Complexity:** \$\mathcal{O}(N)\$

Since Taro can't do the activities for two or more consecutive days, we can
instead define \$\texttt{dp}[i][j]\$ as the best possible value on the \$i\$-th day
that ends on activity \$j\$. Hence, the best we can do for any day \$A\$ is either
the previous best ending on day \$B\$ added to the happiness attained from \$C\$, or
the previous best ending on day \$C\$ added to the happiness attained from \$B\$.
The same goes for days \$B, C\$. In this sense, our formulation is:

\$\$
\texttt{dp}[i][j] = \max_{k \neq j}(dp[i-1][k] + V[d] : d \neq j, d \neq k)
\$\$

\`\`\`cpp
#include <bits/stdc++.h>

using namespace std;

const int mx = 1e5+1;

bool ckmax(int& a, const int& b) {
	return a < b ? a = b, 1 : 0;
}

int dp[mx][3];

int main() {
	cin.tie(0)->sync_with_stdio(0);

	int N; cin >> N;

	for(int i = 1; i <= N; ++i) {
		int a, b, c; cin >> a >> b >> c;
		ckmax(dp[i][0], max(dp[i - 1][1] + b, dp[i - 1][2] + c));
		ckmax(dp[i][1], max(dp[i - 1][0] + a, dp[i - 1][2] + c));
		ckmax(dp[i][2], max(dp[i - 1][0] + a, dp[i - 1][1] + b));
	}

	cout << max(dp[N][0], max(dp[N][1], dp[N][2])) << endl;
}
\`\`\`

## [D - Knapsack 1](https://atcoder.jp/contests/dp/tasks/dp_d)

**Time Complexity:** \$\mathcal{O}(NW)\$

This is the classical knapsack problem. Notice that because \$v_i \le 10^9\$, it
is not feasible to store \$v_i\$ in our \$\texttt{dp}\$ array. Instead, store the
possible values of \$W (W \le 10^5)\$. Let \$\texttt{dp}[i][j]\$ represent the
maximum value that can be attained by the first \$i\$ weights with a weight of
\$j\$. Then, this turns into the classical
[knapsack problem](https://usaco.guide/CPH.pdf#page=82).

\`\`\`cpp
#include <bits/stdc++.h>

using namespace std;

const int mx = 1e5+1;

template<class T> bool ckmax(T& a, const T& b) {
	return a < b ? a = b, 1 : 0;
}

long long dp[101][mx];
int w[101], v[101];

int main() {
	cin.tie(0)->sync_with_stdio(0);

	int N, W; cin >> N >> W;
	for(int i = 0; i < N; ++i) cin >> w[i] >> v[i];

	for(int i = 0; i < N; ++i) for(int j = 0; j <= W; ++j) {
		if(j + w[i] <= W) ckmax(dp[i + 1][j + w[i]], dp[i][j] + v[i]);
		ckmax(dp[i + 1][j], dp[i][j]);
	}

	cout << dp[N][W] << endl;
}
\`\`\`

## [E - Knapsack 2](https://atcoder.jp/contests/dp/tasks/dp_e)

**Time Complexity:** \$\mathcal{O}(N^2V)\$

This is the exact same problem except instead of a high value of \$v_i\$, there is
a high value of \$w_i\$. Now, we must minimize the value of \$w_i\$ for any given
\$v_i\$, and then try to find out the maximum value of \$v_i\$ that can be reached.

Define \$\texttt{dp}[i]\$ as the lowest weight we can achieve for value \$i\$. The
transition then, is:

\$\$
\texttt{dp}[j + \texttt{v}[i]] = \min (\texttt{dp}[j + \texttt{v}[i]],\texttt{dp}[j] + \texttt{w}[i])
\$\$

\`\`\`cpp
#include <bits/stdc++.h>

using namespace std;

const int mx = 1e5+1;

template<class T> bool ckmin(T& a, const T& b) {
	return a > b ? a = b, 1 : 0;
}

long long dp[mx];
int w[101], v[101];

int main() {
	cin.tie(0)->sync_with_stdio(0);

	int N, W; cin >> N >> W;
	for(int i = 0; i < N; ++i) cin >> w[i] >> v[i];
	for(int i = 0; i < mx; ++i) dp[i] = 1e18;

	dp[0] = 0;

	for(int i = 0; i < N; ++i) {
		for(int j = mx - 1; j >= 0; j--) {
			if(dp[j] + w[i] <= W) ckmin(dp[j + v[i]], dp[j] + w[i]);
		}
	}

	for(int i = mx - 1; i >= 0; i--) {
		if(dp[i] != 1e18) {
			cout << i << endl;
			break;
		}
	}
}
\`\`\`

## [F - LCS](https://atcoder.jp/contests/dp/tasks/dp_f)

**Time Complexity:** \$\mathcal{O}(N^2)\$

First read [this](https://usaco.guide/gold/paths-grids?lang=cpp), then following
the according \$\texttt{dp}\$ model, build the string accordingly.

\`\`\`cpp
#include <bits/stdc++.h>

using namespace std;

template<class T> bool ckmax(T& a, const T& b) {
	return a < b ? a = b, 1 : 0;
}

int dp[3001][3001];

int main() {
	cin.tie(0)->sync_with_stdio(0);
	string s, t; cin >> s >> t;
	int n = s.size(), m = t.size();

	for(int i = 0 ; i <= n; ++i) {
		for(int j = 0; j <= m; ++j)  {
			if(!i || !j) dp[i][j] = 0;
			else if(s[i - 1] == t[j - 1]) dp[i][j] = 1 + dp[i - 1][j - 1];
			else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
		}
	}

	string ret = "";

	while(n && m) {
		if(s[n - 1] == t[m - 1]) {
			ret += s[n - 1];
			n--;
			m--;
		}
		else if(dp[n - 1][m] > dp[n][m - 1]) n--;
		else m--;
	 }

	 reverse(ret.begin(), ret.end());

	 cout << ret << endl;
}
\`\`\`

## [G - Longest Path](https://atcoder.jp/contests/dp/tasks/dp_g)

**Time Complexity:** \$\mathcal{O}(N + M)\$

Simply perform a DFS on the graph, defining \$\texttt{dp}[i]\$ as the longest path
that node \$i\$ can take. Notice how the optimal substructure is formed: the best
path for any node \$x\$ is one added to the best path for any of its children.

\`\`\`cpp
#include <bits/stdc++.h>

using namespace std;

vector<int> dp(100001);
vector<vector<int>> adj(100001);

int dfs(int x) {
	if (dp[x]) return dp[x];
	for (auto e : adj[x]){
			dp[e] = dfs(e);
			dp[x] = max(dp[e] + 1, dp[x]);
	}
	return dp[x];
}

int main(){
	int n,m;
	cin >> n >> m;

	for(int i = 0; i < m; ++i) {
		int a, b;
		cin >> a >> b;
		a--; b--;
		adj[a].push_back(b);
	}

	for (int i = 0; i < n; ++i) {
		dfs(i);
	}

	int ans = 0;

	for (int i = 0;i < n; ++i) {
		ans = max(dp[i], ans);
	}

	cout << ans;
}
\`\`\`

## [H - Grid 1](https://atcoder.jp/contests/dp/tasks/dp_h)

**Time Complexity:** \$\mathcal{O}(N^2)\$

A full tutorial can be found
[here](https://usaco.guide/gold/paths-grids?lang=cpp#tutorial).

\`\`\`cpp
#include <bits/stdc++.h>

using namespace std;

bool ok[1000][1000];
long long dp[1000][1000];

int main() {
	cin.tie(0)->sync_with_stdio(0);

	int n; cin >> n;
	for(int i = 0; i < n; ++i) {
		string s;
		cin >> s;
		for(int j = 0; j < n; ++j) {
			if(s[j] == '.') ok[i][j] = true;
			else ok[i][j] = false;
		}
	}

	dp[0][0] = 1;
	for(int i = 0; i < n; ++i) {
		for(int j = 0; j < n; ++j) {
			if(!ok[i][j]) dp[i][j] = 0;
			else {
				if(i > 0) dp[i][j] += dp[i - 1][j];
				if(j > 0) dp[i][j] += dp[i][j - 1];
				dp[i][j] %= 1000000007;
			}
		}
	}

	cout << dp[n - 1][n - 1] << "\n";

	return 0;
}
\`\`\`

## [I - Coins](https://atcoder.jp/contests/dp/tasks/dp_i)

**Time Complexity:** \$\mathcal{O}(N^2)\$

Define \$\texttt{dp}[i][j]\$ to be the probability after tossing the first \$i\$
coins, and receiving \$j\$ heads. Then, our probability of flipping \$j\$ heads from
the first \$i\$ coins is the addition of the following:

- either we flipped a head with probability \$p\$
  - then use \$\$\texttt{dp}[i-1][j-1]\$\$, the probability of receiving \$j-1\$ heads
    from the previous toss.
- we flipped a tail with probability \$1-p\$
  - then use \$\texttt{dp}[i-1][j]\cdot(1-\texttt{p}[i-1])\$, the probability of
    receiving \$j\$ heads from the previous toss.

\$\$
\texttt{dp}[i][j] = \texttt{dp}[i-1][j-1]\cdot \texttt{p}[i-1] + \texttt{dp}[i-1][j]\cdot(1-\texttt{p}[i-1])
\$\$

\`\`\`cpp
#include<bits/stdc++.h>

using namespace std;

long double dp[3001][3001];

int main() {
	cin.tie(0)->sync_with_stdio(0);

	int n;
	cin >> n;

	vector<long double> p(n);

	for(int i = 0; i < n; ++i) cin >> p[i];

	int leastHeads = n / 2 + 1;

	for(int i = 0; i <= n; ++i) {
			dp[i][0] = 1;
	}

	for(int i = 1; i <= n; ++i) {
		for(int j = 1; j <= leastHeads; ++j) {
			dp[i][j] = dp[i - 1][j - 1] * p[i - 1] + dp[i - 1][j] * (1 - p[i - 1]);
		}
	}

	cout << fixed << setprecision(10) << dp[n][leastHeads] << endl;
}
\`\`\`

## [J - Sushi](https://atcoder.jp/contests/dp/tasks/dp_j)

**Time Complexity:** \$\mathcal{O}(N^3)\$

Let \$\texttt{dp}[x][y][z]\$ represent the expected moves for \$x\$ number of plates
1-sushi remaining, \$y\$ number of plates 2-sushi remaining, \$z\$ number of plates
3-sushi remaining.

Then, we can use the relation

\$\$
\texttt{dp}[x][y][z] = n + x \cdot \texttt{dp}[x-1][y][z]
												+ y \cdot \texttt{dp}[x+1][y-1][z]
												+ z \cdot \texttt{dp}[x][y+1][z-1]
\$\$

Note that we add \$1\$ for the \$y\$ and \$z\$ equations because we take from one
sushi platter which transitions into one more sushi in another grouping of
either \$x,y\$. For example, by taking one sushi away from a group of size \$2\$
then there is a corresponding increase in a sushi group of size \$1\$.

\`\`\`cpp
#include <bits/stdc++.h>

using namespace std;

int n;

long double dp[301][301][301];
// let dp[i][j][k] be
// i dishes of 1 sushi
// j dishes of 2 sushi
// k d`
  },
  {
    id: 'post-1',
    title: 'Algorithms in Game Design // Graph Traversals in YoRHa Modules',
    category: 'ALGORITHMS',
    date: '2026-07-09',
    readTime: '6 min read',
    summary: 'An analysis of graph theory, grid traversal optimizations (like Dijkstra and A*), and how tactical HUD displays utilize scan lines for fast routing matrices.',
    content: `## System Initialization: Graph Traversal

In modern tactical grid engines, representing spatial architectures efficiently is paramount. A standard 2D layout (like a map matrix) is modeled as a grid graph $G = (V, E)$, where each grid cell represents a vertex $v \\in V$, and edges $e \\in E$ represent paths to adjacent cells.

### Grid Scan and Dijkstra Node Computations

Using Dijkstra's algorithm allows the unit to find the shortest path from node $S$ to $T$ on a grid with weights representing terrain difficulties (e.g., enemy barriers, water obstacles). The priority queue evaluates vertices based on:

$$d(v) = \\min \\{ d(u) + w(u, v) \\}$$

\`\`\`typescript
// Dijkstra Node Scan Structure
interface Node {
  row: number;
  col: number;
  distance: number;
  isVisited: boolean;
  previousNode: Node | null;
}
\`\`\`

By scanning cells radially, YoRHa units can dynamically re-compute routes in real-time when blocking obstacles are placed in the environment.

### Optimization Matrix

1. **Binary Heaps**: Reduces queue search complexity from $O(V)$ to $O(\\log V)$.
2. **Scan Filters**: Halts expansions once target node $T$ is marked as visited, saving up to 40% memory cycles.
`
  },
  {
    id: 'post-2',
    title: 'CSS Architecture // Recreating YoRHa UI Grids & Scanning Elements',
    category: 'SOFTWARE',
    date: '2026-06-30',
    readTime: '4 min read',
    summary: 'A look behind the stylesheets. Learn how custom gradients, keyframe animations, scanline bars, and subtle grain effects are orchestrated to produce premium retro digital interfaces.',
    content: `## The Anatomy of YoRHa UI

The UI design of NieR: Automata is celebrated for its elegance, tactical responsiveness, and beige color schemes. Achieving this in a modern browser requires standard Vanilla CSS and custom CSS variables.

### The Dotted Grid Overlay

To give a page a military-grade CRT screen look, we overlay a repeating radial gradient. This generates fine, subtle background dots:

\`\`\`css
.nier-grid-overlay {
  background-image: 
    radial-gradient(var(--nier-grid-line) 1px, transparent 1px);
  background-size: 20px 20px;
}
\`\`\`

### Scanline Scrolling Animations

A linear gradient combined with a slow vertical keyframe animation mimics screen scan refreshes. We keep opacity very low (around 3%) to ensure readability is not compromised:

\`\`\`css
@keyframes scan {
  0% { top: -100px; }
  100% { top: 100%; }
}
\`\`\`

### Key Stylings to Keep in Mind

- **Monospace Text**: Use \`Share Tech Mono\` for numerical lists and stat callouts.
- **Micro-Glitches**: Inject slight pixel transformations on buttons when hovered to suggest mechanical interference.
`
  },
  {
    id: 'post-3',
    title: 'Otaku Analysis // The Cybernetic Despair of Serial Experiments Lain',
    category: 'ART & CULTURE',
    date: '2026-06-15',
    readTime: '8 min read',
    summary: 'Exploring the philosophical constructs, wire matrices, and identity breakdowns inside the classic 1998 cyberpunk masterpiece Serial Experiments Lain.',
    content: `## Welcome to the Wired

*Serial Experiments Lain* (1998) stands as one of the most prescient anime series ever created. It explores the blurred boundaries between the physical world (The Real World) and the digital network (The Wired).

### Identity and the Collective Consciousness

Lain Iwakura's journey shows the devolution of physical selfhood into omnipotent digital matrices. The series poses several core questions:
- *Is physical presence a requirement for existence?*
- *Can memories exist independently of human brains?*
- *Does the network constitute a new godhead?*

### Visual Language

The series uses ambient noise, humming power lines, and sharp contrasting shadows. This aesthetic directly matches the desolation and post-humanism found in the NieR ruins. The power line hum represents the constant, inescapable voice of the Wired.
`
  }
];

export const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [mode, setMode] = useState<'read' | 'write'>('read');

  // Customize Reading options
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [fontFamily, setFontFamily] = useState<'mono' | 'sans'>('sans');

  // Editor form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('SOFTWARE');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');

  // Custom enhancement states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Initial load
  useEffect(() => {
    const savedPosts = localStorage.getItem('yorha_blog_posts');
    if (savedPosts) {
      const parsed = JSON.parse(savedPosts);
      const hasAtCoder = parsed.some((p: any) => p.id === 'post-atcoder-dp');
      if (!hasAtCoder) {
        const merged = [
          ...DEFAULT_POSTS.filter(dp => dp.id === 'post-atcoder-dp'),
          ...parsed
        ];
        setPosts(merged);
        localStorage.setItem('yorha_blog_posts', JSON.stringify(merged));
      } else {
        setPosts(parsed);
      }
    } else {
      setPosts(DEFAULT_POSTS);
      localStorage.setItem('yorha_blog_posts', JSON.stringify(DEFAULT_POSTS));
    }
  }, []);

  const selectPost = (postId: string) => {
    Sound.playClick();
    setActivePostId(postId);
  };

  const handleSavePost = () => {
    if (!title || !content) {
      Sound.playWarning();
      alert('INPUT ERROR: Title and Content modules are required.');
      return;
    }

    if (editingPostId) {
      // Edit post mode
      const updated = posts.map(p => {
        if (p.id === editingPostId) {
          return {
            ...p,
            title,
            category: category.toUpperCase(),
            summary: summary || content.slice(0, 100) + '...',
            content,
            readTime: `${Math.max(1, Math.ceil(content.split(' ').length / 150))} min read`
          };
        }
        return p;
      });
      setPosts(updated);
      localStorage.setItem('yorha_blog_posts', JSON.stringify(updated));
      setActivePostId(editingPostId);
      setEditingPostId(null);

      // Clear form
      setTitle('');
      setSummary('');
      setContent('');
      setMode('read');
      Sound.playChime();
    } else {
      // Create post mode
      const newPost: BlogPost = {
        id: `post-${Date.now()}`,
        title,
        category: category.toUpperCase(),
        date: new Date().toISOString().split('T')[0],
        readTime: `${Math.max(1, Math.ceil(content.split(' ').length / 150))} min read`,
        summary: summary || content.slice(0, 100) + '...',
        content
      };

      const updated = [newPost, ...posts];
      setPosts(updated);
      localStorage.setItem('yorha_blog_posts', JSON.stringify(updated));

      // Clear form
      setTitle('');
      setSummary('');
      setContent('');
      setActivePostId(newPost.id);
      setMode('read');
      Sound.playChime();
    }
  };

  const handleDeletePost = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Sound.playWarning();
    setConfirmDeleteId(postId);
  };

  const confirmDeleteAction = () => {
    if (!confirmDeleteId) return;
    const updated = posts.filter((p) => p.id !== confirmDeleteId);
    setPosts(updated);
    localStorage.setItem('yorha_blog_posts', JSON.stringify(updated));

    if (activePostId === confirmDeleteId) {
      setActivePostId(null);
    }
    setConfirmDeleteId(null);
    Sound.playChime();
  };

  const handleStartEdit = (post: BlogPost) => {
    Sound.playClick();
    setEditingPostId(post.id);
    setTitle(post.title);
    setCategory(post.category);
    setSummary(post.summary);
    setContent(post.content);
    setMode('write');
  };

  const handleExportJSON = () => {
    Sound.playClick();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(posts, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "yorha_blog_backup.json");
    dlAnchorElem.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
            setPosts(parsed);
            localStorage.setItem('yorha_blog_posts', JSON.stringify(parsed));
            Sound.playChime();
          } else {
            throw new Error();
          }
        } catch (err) {
          Sound.playWarning();
          alert('IMPORT ERROR: Invalid database file structure.');
        }
      };
    }
  };

  const activePost = posts.find((p) => p.id === activePostId);

  // Filter posts based on search string and category selection
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = 
      selectedCategoryFilter === 'ALL' || post.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Styling helper for font sizes
  const getFontSizeStyle = () => {
    switch (fontSize) {
      case 'small': return { fontSize: '13px', lineHeight: '1.5' };
      case 'large': return { fontSize: '18px', lineHeight: '1.7' };
      case 'medium':
      default:
        return { fontSize: '15px', lineHeight: '1.6' };
    }
  };

  return (
    <div className="content-section" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div className="title-decorator">
        <span className="tag">DATA</span>
        <h2>[05_BLOG] // KNOWLEDGE_ARCHIVES</h2>
        <div className="line" />
        <span className="tag">{posts.length} RECORDS</span>
      </div>

      {/* Mode selectors */}
      <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '10px' }}>
        <button 
          className={`nier-btn ${mode === 'read' ? 'active' : ''}`}
          onClick={() => { 
            Sound.playClick(); 
            setEditingPostId(null); 
            setMode('read'); 
          }}
        >
          <BookOpen size={14} /> [ READ RECORDS ]
        </button>
        <button 
          className={`nier-btn ${mode === 'write' ? 'active' : ''}`}
          onClick={() => { 
            Sound.playClick(); 
            setEditingPostId(null); 
            setTitle('');
            setSummary('');
            setContent('');
            setCategory('SOFTWARE');
            setMode('write'); 
          }}
        >
          <Edit3 size={14} /> [ COMPOSE MODULE ]
        </button>
        
        <div style={{ flexGrow: '1' }} />

        {/* Backups */}
        <button className="nier-btn small" onClick={handleExportJSON} title="Backup to JSON file">
          <Download size={12} /> BACKUP
        </button>
        
        <label className="nier-btn small" style={{ cursor: 'pointer' }} title="Import backup file">
          <Upload size={12} /> LOAD
          <input type="file" onChange={handleImportJSON} style={{ display: 'none' }} accept=".json" />
        </label>
      </div>

      {mode === 'read' ? (
        /* READ RECORDS INTERFACE */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '30px' }}>
          
          {/* Post Selection Side panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="nier-panel" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '580px' }}>
              <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px', margin: 0 }}>ARCHIVE INDEX</h3>
              
              {/* Filter inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="text"
                  placeholder="SEARCH MODULES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: 'var(--nier-bg)',
                    border: '1px solid var(--nier-border)',
                    color: 'var(--nier-text)',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                  {['ALL', 'SOFTWARE', 'ALGORITHMS', 'ART & CULTURE', 'SYSTEMS'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => { Sound.playHover(); setSelectedCategoryFilter(cat); }}
                      style={{
                        border: '1px solid var(--nier-border-muted)',
                        background: selectedCategoryFilter === cat ? 'var(--nier-text)' : 'transparent',
                        color: selectedCategoryFilter === cat ? 'var(--nier-bg)' : 'var(--nier-text)',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontSize: '8px'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: '1', paddingRight: '4px' }}>
                {filteredPosts.length > 0 ? filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => selectPost(post.id)}
                    style={{
                      border: activePostId === post.id ? '2px solid var(--nier-text)' : '1px solid var(--nier-border-muted)',
                      padding: '10px',
                      cursor: 'pointer',
                      backgroundColor: activePostId === post.id ? 'rgba(78,75,66,0.05)' : 'transparent',
                    }}
                    className="glitch-hover"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--nier-text-muted)', marginBottom: '4px' }}>
                      <span>[{post.category}]</span>
                      <span>{post.date}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', lineHeight: '1.3' }}>
                      {post.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--nier-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} /> {post.readTime}
                      </span>
                      <button 
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}
                        onClick={(e) => handleDeletePost(post.id, e)}
                        title="Delete log"
                      >
                        <Trash2 size={12} style={{ color: 'var(--nier-accent)' }} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                    NO COMPATIBLE LOGS LOCATED
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Reader Panel */}
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
            {activePost ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: '1' }}>
                
                {/* Customizable Reading bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', padding: '6px 12px', borderBottom: '1px solid var(--nier-border-muted)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <Settings size={12} style={{ color: 'var(--nier-text-muted)' }} />
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--nier-text-muted)' }}>VIEW_OPT:</span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Font Family toggler */}
                    <div style={{ display: 'flex', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      <button 
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: fontFamily === 'sans' ? 'bold' : 'normal', textDecoration: fontFamily === 'sans' ? 'underline' : 'none' }}
                        onClick={() => { Sound.playHover(); setFontFamily('sans'); }}
                      >
                        SANS
                      </button>
                      <span style={{ color: 'var(--nier-border-muted)' }}>/</span>
                      <button 
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: fontFamily === 'mono' ? 'bold' : 'normal', textDecoration: fontFamily === 'mono' ? 'underline' : 'none' }}
                        onClick={() => { Sound.playHover(); setFontFamily('mono'); }}
                      >
                        MONO
                      </button>
                    </div>
                    
                    <span style={{ color: 'var(--nier-border-muted)' }}>|</span>

                    {/* Font Size toggler */}
                    <div style={{ display: 'flex', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      <button 
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: fontSize === 'small' ? 'bold' : 'normal', textDecoration: fontSize === 'small' ? 'underline' : 'none' }}
                        onClick={() => { Sound.playHover(); setFontSize('small'); }}
                      >
                        A-
                      </button>
                      <button 
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: fontSize === 'medium' ? 'bold' : 'normal', textDecoration: fontSize === 'medium' ? 'underline' : 'none' }}
                        onClick={() => { Sound.playHover(); setFontSize('medium'); }}
                      >
                        A
                      </button>
                      <button 
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: fontSize === 'large' ? 'bold' : 'normal', textDecoration: fontSize === 'large' ? 'underline' : 'none' }}
                        onClick={() => { Sound.playHover(); setFontSize('large'); }}
                      >
                        A+
                      </button>
                    </div>

                    <span style={{ color: 'var(--nier-border-muted)' }}>|</span>

                    <button 
                      className="nier-btn small" 
                      style={{ padding: '2px 8px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleStartEdit(activePost)}
                    >
                      <Edit3 size={10} /> [ EDIT RECORD ]
                    </button>

                  </div>
                </div>

                {/* Article Header */}
                <div style={{ borderBottom: '2px solid var(--nier-border)', paddingBottom: '12px', marginBottom: '20px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--nier-accent)', marginBottom: '6px' }}>
                    [{activePost.category}] // RECORDED: {activePost.date}
                  </div>
                  <h2 style={{ fontSize: '24px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--nier-text)' }}>
                    {activePost.title}
                  </h2>
                </div>

                {/* Article Content Area */}
                <div 
                  style={{
                    ...getFontSizeStyle(),
                    fontFamily: fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)',
                    textAlign: 'justify',
                    
                    color: 'var(--nier-text)',
                  }}
                  className="blog-content"
                >
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(activePost.content) }} />
                </div>

              </div>
            ) : (
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--nier-text-muted)' }}>
                <BookOpen size={48} style={{ strokeWidth: 1, marginBottom: '15px' }} />
                <p style={{ fontFamily: 'var(--font-mono)' }}>SELECT A DATABASE MODULE TO BEGIN DIAGNOSTICS</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* WRITE MODULE INTERFACE */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* Editor Form */}
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '15px', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px', fontFamily: 'var(--font-mono)' }}>
              {editingPostId ? 'MODIFY INTERFACE // EDITING' : 'INPUT INTERFACE // NEW MODULE'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              
              {/* Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontFamily: 'var(--font-mono)' }}>RECORD TITLE</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Memory optimizations in JavaScript engines"
                  style={{
                    backgroundColor: 'var(--nier-bg)',
                    border: '1px solid var(--nier-border)',
                    color: 'var(--nier-text)',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>

              {/* Category & Read Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)' }}>MODULE CATEGORY</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      backgroundColor: 'var(--nier-bg)',
                      border: '1px solid var(--nier-border)',
                      color: 'var(--nier-text)',
                      padding: '8px 12px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="ALGORITHMS">ALGORITHMS</option>
                    <option value="ART & CULTURE">ART & CULTURE</option>
                    <option value="SYSTEMS">SYSTEMS</option>
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontFamily: 'var(--font-mono)' }}>SUMMARY PREVIEW</label>
                <input 
                  type="text" 
                  value={summary} 
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary sentence..."
                  style={{
                    backgroundColor: 'var(--nier-bg)',
                    border: '1px solid var(--nier-border)',
                    color: 'var(--nier-text)',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>

              {/* Content body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontFamily: 'var(--font-mono)' }}>MARKDOWN CONTENT</label>
                <textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="## Write header&#10;Write post details here... use standard paragraphs and lists."
                  rows={10}
                  style={{
                    backgroundColor: 'var(--nier-bg)',
                    border: '1px solid var(--nier-border)',
                    color: 'var(--nier-text)',
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <button 
              className="nier-btn" 
              onClick={handleSavePost}
              style={{ width: '100%', marginTop: '10px' }}
            >
              <Save size={14} /> {editingPostId ? '[ SAVE CHANGES TO MODULE ]' : '[ SAVE MODULE TO ARCHIVE ]'}
            </button>
          </div>

          {/* Live Preview Panel */}
          <div className="nier-panel" style={{ display: 'flex', flexDirection: 'column', maxHeight: '540px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--nier-accent)', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '6px', marginBottom: '15px' }}>
              YoRHa PREVIEW ENGINE
            </h3>

            {title || content ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ borderBottom: '2px solid var(--nier-border)', paddingBottom: '12px', marginBottom: '15px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-accent)' }}>
                    [{category.toUpperCase()}] // COMPILE_LIVE
                  </div>
                  <h2 style={{ fontSize: '20px', fontFamily: 'var(--font-mono)' }}>
                    {title || 'UNTITLED RECORD'}
                  </h2>
                </div>

                <div style={{ fontSize: '14px', textAlign: 'justify' }}>
                  {content ? <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }} /> : <p style={{ fontStyle: 'italic', color: 'var(--nier-text-muted)' }}>Writing content will trigger live parsing...</p>}
                </div>
              </div>
            ) : (
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--nier-text-muted)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>AWAITING COMPILE INPUTS</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* YoRHa Custom Confirmation Modal for record deletion */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(1px)'
        }}>
          <div className="nier-panel" style={{
            width: '400px',
            padding: '25px',
            border: '2px solid var(--nier-accent)',
            backgroundColor: 'var(--nier-bg)',
            boxShadow: '6px 6px 0px rgba(0,0,0,0.15)',
            position: 'relative'
          }}>
            <h3 style={{
              fontSize: '15px',
              color: 'var(--nier-accent)',
              fontFamily: 'var(--font-mono)',
              margin: '0 0 15px 0',
              borderBottom: '1px solid var(--nier-accent)',
              paddingBottom: '6px'
            }}>
              [ SYSTEM WARNING // COGNITIVE PURGE ]
            </h3>
            <p style={{
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--nier-text)',
              lineHeight: '1.5',
              margin: '0 0 25px 0'
            }}>
              ARE YOU SURE YOU WANT TO PURGE THIS LOG RECORD FROM THE DATABASE MODULE INDEX? THIS OPERATION CANNOT BE UNDONE.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button 
                className="nier-btn small" 
                style={{
                  padding: '4px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--nier-accent)',
                  borderColor: 'var(--nier-accent)',
                  cursor: 'pointer'
                }}
                onClick={confirmDeleteAction}
              >
                [ CONFIRM PURGE ]
              </button>
              <button 
                className="nier-btn small" 
                style={{
                  padding: '4px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
                onClick={() => { Sound.playHover(); setConfirmDeleteId(null); }}
              >
                [ CANCEL ]
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
