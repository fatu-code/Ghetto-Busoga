/* ── BGS depots.js — Depot (Ghetto Cell) names per district ───────────
 * Keyed by district CODE (see DISTRICTS in app.js).
 * Counts match each district's target: Jinja City 20, Iganga 15, rest 10.
 * Names are real local trading centres / suburbs / cells and deliberately
 * DO NOT repeat the district's own name. Edit freely as the program grows.
 */
const DEPOTS = {
  // JJA — Jinja City (20 urban cells / suburbs)
  JJA: ["Bugembe", "Buwenda", "Central", "Danida", "Kibuye", "Kikaramoja", "Kimaka", "Loco", "Lubas", "Masese", "Mpambire", "Mpumudde", "Nalufenya", "Nile", "Rippon", "Rubaga", "Soweto", "Wairaka", "Walukuba", "Wanyange"],

  // IGA — Iganga (15)
  IGA: ["Bugono", "Bulamagi", "Bulubandi", "Bugumba", "Bunyiro", "Kibimba", "Nabitende", "Naibiri", "Nakalama", "Nakavule", "Nakigo", "Nambale", "Namungalwe", "Nawampologoma", "Nawandala"],

  // JJD — Jinja District (10)
  JJD: ["Budondo", "Busedde", "Butagaya", "Buwenge", "Buyengo", "Kakira", "Lukolo", "Mafubira", "Namulesa", "Wakitaka"],

  // KLR — Kaliro (10)
  KLR: ["Budomero", "Bukamba", "Bumanya", "Buyinda", "Gadumire", "Kasokwe", "Kisinda", "Namugongo", "Namwiwa", "Nawaikoke"],

  // LUK — Luuka (10)
  LUK: ["Bukanga", "Bukoba", "Bukooma", "Bulongo", "Buwala", "Ikumbya", "Irongo", "Kiyunga", "Nawampiti", "Waibuga"],

  // MYG — Mayuge (10)
  MYG: ["Baitambogwe", "Bukabooli", "Bukatube", "Bwondha", "Imanyiro", "Jaguzi", "Kigandalo", "Kityerera", "Malongo", "Mpungwe"],

  // NMY — Namayingo (10)
  NMY: ["Banda", "Bukana", "Buswale", "Buyinja", "Hama", "Lolwe", "Lugala", "Mutumba", "Sigulu", "Sikuda"],

  // BGR — Bugiri (10)
  BGR: ["Budhaya", "Bulesa", "Bulidha", "Buluguyi", "Buwunga", "Iwemba", "Kapyanga", "Muterere", "Nabukalu", "Nankoma"],

  // BGW — Bugweri (10)
  BGW: ["Bugobya", "Bukoyo", "Busembatia", "Buyanga", "Idudi", "Igombe", "Lubira", "Makuutu", "Namalemba", "Nawanjofu"],

  // NMT — Namutumba (10)
  NMT: ["Bulange", "Buyodi", "Ivukula", "Kibaale", "Kisiki", "Magada", "Naibowa", "Nabweyo", "Nawaikona", "Nsinze"],

  // KML — Kamuli (10)
  KML: ["Balawoli", "Bugulumbya", "Butansi", "Kisozi", "Kitayunjwa", "Mbulamuti", "Nabwigulu", "Namwendwa", "Nankandulo", "Wankole"],

  // BYD — Buyende (10)
  BYD: ["Bugaya", "Bugoba", "Bumwena", "Igayaza", "Irundu", "Kabukye", "Kagulu", "Kidera", "Nansololo", "Nkondo"],
};
