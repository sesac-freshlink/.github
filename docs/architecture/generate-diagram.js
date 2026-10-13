const fs = require('fs');
const W = 1700, H = 1100;
const F = "Malgun Gothic, 'Segoe UI', sans-serif";
let s = [];
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const C = { net: '#8C4FFF', cmp: '#ED7100', sto: '#7AA116', db: '#3B48CC', int: '#E7157B', sec: '#DD344C', gray: '#545B64', toss: '#0064FF', gh: '#24292F' };

function text(x, y, t, o = {}) {
  const lines = t.split('\n'), size = o.size || 13, lh = size + 3;
  lines.forEach((l, i) => s.push(`<text x="${x}" y="${y + i * lh}" font-family="${F}" font-size="${size}" font-weight="${o.bold ? 700 : 400}" fill="${o.fill || '#232F3E'}" text-anchor="${o.anchor || 'middle'}"${o.halo ? ' paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round"' : ''}${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>${esc(l)}</text>`));
}
function group(x, y, w, h, o) {
  s.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.sw || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
  let tx = x + 10;
  if (o.tag) { s.push(`<rect x="${x}" y="${y}" width="28" height="28" fill="${o.tag}"/>`); text(x + 14, y + 19, o.tagText || '', { fill: '#fff', size: 11, bold: true }); tx = x + 36; }
  if (o.title) text(tx, y + 19, o.title, { anchor: 'start', bold: true, fill: o.tcolor || '#232F3E', size: o.tsize || 13 });
}
function icon(cx, cy, color, glyph, label, o = {}) {
  const d = o.dash ? ` stroke="${color}" stroke-width="2" stroke-dasharray="5 4" fill="#fff"` : ` fill="${color}"`;
  s.push(`<rect x="${cx - 26}" y="${cy - 26}" width="52" height="52" rx="6"${d}/>`);
  text(cx, cy + 5, glyph, { fill: o.dash ? color : '#fff', size: glyph.length > 4 ? 10 : 13, bold: true });
  if (label) text(cx, cy + 44, label, { bold: true, size: 12 });
}
function pod(x, y, t, color = C.cmp) {
  s.push(`<rect x="${x}" y="${y}" width="145" height="32" rx="16" fill="#fff" stroke="${color}" stroke-width="1.6"/>`);
  text(x + 72, y + 21, t, { size: 12, bold: true, fill: color === C.cmp ? '#232F3E' : color });
}
function arrow(pts, o = {}) {
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
  const col = o.color || '#232F3E';
  s.push(`<path d="${d}" fill="none" stroke="${col}" stroke-width="1.6"${o.dash ? ' stroke-dasharray="6 4"' : ''} marker-end="url(#a)"${o.both ? ' marker-start="url(#as)"' : ''}/>`);
  if (o.label) label(o.lx, o.ly, o.label, o);
}
// step label: circled number becomes a bold badge in one accent color, rest stays as text
const BADGE = '#E5243B';
function label(lx, ly, t, o) {
  const m = t.match(/^([①-⑳])\s*(.*)$/);
  if (!m) return text(lx, ly, t, { size: 11.5, halo: true, rot: o.rot, fill: o.lcolor || '#232F3E' });
  const n = m[1].charCodeAt(0) - 0x2460 + 1, rest = m[2];
  const w = [...rest].reduce((a, c) => a + (c.charCodeAt(0) > 0x2E80 ? 12 : 6.8), 0);
  const bw = 28, total = bw + (rest ? 5 + w : 0), x0 = lx - total / 2;
  s.push(`<g${o.rot ? ` transform="rotate(${o.rot} ${lx} ${ly})"` : ''}>`);
  if (rest) s.push(`<rect x="${x0 + bw}" y="${ly - 15}" width="${w + 8}" height="20" fill="#fff"/>`);
  // badge is drawn upright even on rotated labels
  let bx = x0 + bw / 2, by = ly - 5;
  if (o.rot) { s.push('</g>'); [bx, by] = [lx + (by - ly), ly - (bx - lx)]; }
  s.push(`<rect x="${bx - bw / 2}" y="${by - bw / 2}" width="${bw}" height="${bw}" rx="6" fill="${BADGE}" stroke="#fff" stroke-width="2"/>`);
  text(bx, by + 6, String(n), { size: 17, bold: true, fill: '#fff' });
  if (o.rot) s.push(`<g transform="rotate(${o.rot} ${lx} ${ly})">`);
  if (rest) text(x0 + bw + 5, ly, rest, { size: 12.5, bold: true, anchor: 'start', fill: o.lcolor || '#232F3E' });
  s.push('</g>');
}

// ---------- groups ----------
group(190, 20, 1330, 1060, { stroke: '#232F3E', sw: 2, tag: '#232F3E', tagText: 'aws', title: 'AWS Cloud' });
group(340, 60, 1160, 1000, { stroke: '#147EBA', tag: '#147EBA', tagText: '⚑', title: 'Region · 서울 ap-northeast-2', tcolor: '#147EBA' });
group(400, 110, 850, 930, { stroke: '#7AA116', sw: 2, tag: '#7AA116', tagText: 'VPC', title: 'VPC 10.0.0.0/16', tcolor: '#3F8624' });
group(430, 150, 800, 380, { stroke: '#147EBA', dash: '6 4', title: 'AZ · ap-northeast-2a', tcolor: '#147EBA' });
group(430, 620, 800, 400, { stroke: '#147EBA', dash: '6 4', title: 'AZ · ap-northeast-2c', tcolor: '#147EBA' });
const sub = (x, y, w, h, pub, t) => group(x, y, w, h, { fill: pub ? '#E9F3E6' : '#E6F2F8', tag: pub ? '#7AA116' : '#147EBA', tagText: pub ? 'P' : 'Pr', title: t, tcolor: pub ? '#3F8624' : '#147EBA', tsize: 12 });
sub(450, 185, 170, 330, true, 'public-a /24');
sub(650, 185, 380, 330, false, 'app-a /20 (private)');
sub(1050, 185, 180, 330, false, 'db-a /24 (private)');
sub(450, 655, 170, 350, true, 'public-c /24');
sub(650, 655, 380, 350, false, 'app-c /20 (private)');
sub(1050, 655, 180, 350, false, 'db-c /24 (private)');
// EKS cluster (spans both AZs)
s.push(`<rect x="665" y="225" width="350" height="765" rx="8" fill="none" stroke="${C.cmp}" stroke-width="2" stroke-dasharray="8 5"/>`);
text(840, 568, 'EKS Cluster', { bold: true, fill: C.cmp, size: 14 });
text(840, 586, 'Managed Node Group · t3.large × 2', { fill: C.cmp, size: 12 });
// nodes + pods (observability pods in teal)
const OBS = '#0F8B8D';
const podColor = t => t === 'ArgoCD' ? '#EF7B4D' : ['Prometheus', 'Grafana', 'Loki', 'Zipkin'].includes(t) ? OBS : C.cmp;
group(680, 255, 320, 245, { fill: '#fff', stroke: C.cmp, title: 'EKS 노드 1 · t3.large  + Alloy(데몬셋)', tcolor: C.cmp, tsize: 12 });
[['gateway #1', 'inventory #1', 'order #1', 'member #1'], ['ArgoCD', 'Prometheus', 'Grafana']].forEach((col, ci) => col.forEach((t, ri) => pod(695 + ci * 155, 290 + ri * 50, t, podColor(t))));
group(680, 690, 320, 285, { fill: '#fff', stroke: C.cmp, title: 'EKS 노드 2 · t3.large  + Alloy(데몬셋)', tcolor: C.cmp, tsize: 12 });
[['gateway #2', 'inventory #2', 'order #2', 'logistics-simulator'], ['LB Controller', 'Loki', 'Zipkin', 'ArgoCD']].forEach((col, ci) => col.forEach((t, ri) => t && pod(695 + ci * 155, 725 + ri * 50, t, podColor(t))));
label(840, 958, '⑤ gateway → member·inventory·order (JWT 검증)', {});

// SQS group
group(1268, 250, 220, 640, { stroke: C.int, dash: '6 4', title: 'Amazon SQS', tcolor: C.int });
icon(1378, 330, C.int, 'FIFO', 'inventory-commands.fifo\n그룹 = 점포(storeId)');
icon(1378, 530, C.int, 'SQS', 'inventory-results\n(표준 큐)');
icon(1333, 770, C.int, 'DLQ', 'commands\n-dlq');
icon(1423, 770, C.int, 'DLQ', 'results\n-dlq');
arrow([[1352, 330], [1290, 330], [1290, 770], [1307, 770]], { dash: 1, color: C.int });
arrow([[1404, 530], [1472, 530], [1472, 770], [1449, 770]], { dash: 1, color: C.int });
text(1378, 862, '3회 실패 시 자동 이동', { size: 11, fill: C.int });

// ---------- icons ----------
icon(80, 210, C.gray, 'USER', '사용자\n점주 포스기 · 고객 폰');
icon(262, 210, C.net, 'CF', 'CloudFront\n+ ACM (HTTPS)');
icon(262, 410, C.sto, 'S3', 'S3 (비공개)\nReact 빌드 파일');
icon(262, 560, C.sto, 'S3', 'S3 (Loki 로그)\n14일 보관');
icon(262, 700, C.cmp, 'ECR', 'ECR\n리포지토리 5개');
icon(262, 900, C.sec, 'IAM', 'IAM\nGitHub OIDC · IRSA');
icon(400, 575, C.net, 'IGW', '');
text(400, 618, 'IGW', { bold: true, size: 12, halo: true });
icon(540, 575, C.net, 'ALB', '');
text(596, 548, 'ALB', { bold: true, size: 12, halo: true });
text(535, 280, 'ALB 노드 (2a)', { size: 11, fill: '#3F8624' });
text(535, 750, 'ALB 노드 (2c)', { size: 11, fill: '#3F8624' });
icon(535, 420, C.net, 'NAT', 'NAT Gateway');
icon(1140, 330, C.db, 'RDS', 'RDS MySQL\ndb.t4g.small (기본)');
icon(1140, 800, C.db, 'RDS', '대기 인스턴스\n(다중 AZ 시)', { dash: 1 });
icon(1610, 300, C.toss, 'toss', '토스페이먼츠\n(테스트 결제)');
// GitHub
group(12, 600, 165, 420, { stroke: C.gh, dash: '6 4', title: 'GitHub', tcolor: C.gh });
icon(95, 665, C.gh, 'REPO', '앱 레포 5개');
icon(95, 795, C.gh, 'CI', 'GitHub Actions');
icon(95, 935, C.gh, 'GitOps', 'gitops 레포');

// ---------- arrows ----------
arrow([[106, 210], [236, 210]], { label: '① HTTPS', lx: 171, ly: 200 });
arrow([[262, 236], [262, 384]], { label: '② / 화면 (OAC)', lx: 262, ly: 318 });
arrow([[288, 200], [328, 200], [328, 575], [374, 575]], { label: '③ /api/*', lx: 328, ly: 525 });
arrow([[426, 575], [514, 575]]);
arrow([[566, 565], [635, 565], [635, 306], [695, 306]], { label: '④ target ip', lx: 635, ly: 470, rot: -90 });
arrow([[566, 585], [635, 585], [635, 741], [695, 741]]);
arrow([[1000, 318], [1112, 318]], { both: 1, label: '⑥ JDBC', lx: 1060, ly: 310 });
arrow([[1000, 835], [1040, 835], [1040, 345], [1112, 345]], { both: 1 });
arrow([[1140, 398], [1140, 772]], { dash: 1, color: C.db, label: '복제(선택)', lx: 1180, ly: 700 });
arrow([[1015, 600], [1266, 600]], { both: 1, dash: 1, color: C.int, label: '⑦ 큐 송수신 (IRSA)', lx: 1188, ly: 592, lcolor: C.int });
arrow([[680, 432], [561, 432]], { dash: 1, label: '⑧', lx: 598, ly: 458 });
arrow([[561, 408], [600, 408], [600, 130], [1610, 130], [1610, 272]], { dash: 1, color: C.toss, label: '⑧ 결제 승인 API (order → NAT → IGW)', lx: 1050, ly: 124, lcolor: C.toss });
arrow([[95, 691], [95, 767]]);
arrow([[121, 805], [205, 805], [205, 700], [236, 700]], { dash: 1, label: '⑨ OIDC · push', lx: 205, ly: 760, rot: -90 });
arrow([[95, 821], [95, 907]], { dash: 1, label: '⑩ 태그 커밋', lx: 95, ly: 872 });
arrow([[121, 945], [150, 945], [150, 1050], [920, 1050], [920, 902]], { dash: 1, color: '#EF7B4D', label: '⑪ ArgoCD가 gitops 레포를 pull (GitOps)', lx: 520, ly: 1054, lcolor: '#C2410C' });
arrow([[288, 700], [665, 700]], { dash: 1, color: C.cmp, label: '⑪ 이미지 pull', lx: 372, ly: 692, lcolor: C.cmp });
arrow([[121, 785], [182, 785], [182, 420], [236, 420]], { dash: 1, color: C.sto, label: '⑫ 프론트 배포 · CF 무효화', lx: 182, ly: 600, rot: -90, lcolor: '#3F8624' });

arrow([[665, 975], [312, 975], [312, 600], [290, 580]], { dash: 1, color: OBS, label: '⑬ Loki 로그 저장 (IRSA)', lx: 470, ly: 970, lcolor: OBS });
text(840, 1013, '청록: 관측성 (지표·로그·추적 → Grafana)', { size: 11, fill: OBS, bold: true });
// EventBridge Scheduler: weekday RDS stop/start and node group 0 <-> 2
icon(1378, 955, C.int, 'EB', 'EventBridge Scheduler\nAsia/Seoul');
arrow([[1352, 955], [1254, 955]], { dash: 1, color: C.int });
label(1378, 1035, '⑭ RDS 중지·시작 · 노드 0↔2', { lcolor: C.int });
// Cognito: sign-up / sign-in from the browser, gateway verifies tokens with the JWKS public key
icon(1378, 178, C.sec, 'Cognito', 'Cognito User Pool\nOWNER · CUSTOMER');
arrow([[80, 184], [80, 95], [1320, 95], [1320, 178], [1352, 178]], { label: '⑮ 가입·로그인 → JWT 발급 (Amplify)', lx: 1010, ly: 99, lcolor: C.sec });
// legend
text(1530, 1000, '실선: 사용자 요청', { anchor: 'start', size: 11, fill: C.gray });
text(1530, 1018, '점선: 메시지 · 배포', { anchor: 'start', size: 11, fill: C.gray });
text(W / 2, 1094, 'FreshLink 아키텍처 구조도', { bold: true, size: 13, fill: C.gray });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker>
<marker id="as" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10 0L0 5L10 10z" fill="context-stroke"/></marker></defs>
<rect width="100%" height="100%" fill="#fff"/>
${s.join('\n')}
</svg>`;
fs.writeFileSync(process.argv[2], svg);
