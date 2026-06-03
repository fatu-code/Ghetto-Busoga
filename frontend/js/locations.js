// ── BUSOGA ADMINISTRATIVE UNITS ─────────────────────────────────────
// District (code) -> Sub-County -> [Parishes / Wards]
// Extracted from the Electoral Commission National Voters' Register
// (Packing List, 16/09/2025). District codes match DISTRICTS in app.js.
// Town Council "parishes" are wards; kept as-is for fidelity.
// ────────────────────────────────────────────────────────────────────
const LOCATIONS = {
  // ── 007 IGANGA ────────────────────────────────────────────────────
  IGA: {
    "Nabitende": ["Bugono", "Itanda", "Kabira-Ituba", "Kasambika", "Nabitende", "Naluko"],
    "Nambale": ["Mwira", "Nambale", "Nasuti"],
    "Namungalwe Town Council": ["Bulumwaki Ward", "Mwendanfuko", "Namungalwe Ward", "Namunkanaga", "Namunkesu Ward", "Namunsaala Ward", "Nawansega Ward"],
    "Nawandala": ["Bugongo", "Kiwanyi", "Kyendabawala", "Namusiisi", "Nawangaiza"],
    "Kidaago": ["Naibiri", "Kidaago", "Kazigo", "Nabitende"],
    "Bulamagi": ["Bukoyo", "Bulamagi", "Bulowooza", "Bwanalira", "Iwawu"],
    "Nakalama": ["Bukaye", "Bukoona", "Buseyi", "Nakalama"],
    "Nakigo": ["Bulubandi", "Bunyama", "Busowoobi", "Kabira", "Wairama"],
    "Nawanyingi": ["Bunyiro", "Magogo", "Nawanyingi"],
    "Central Division": ["Nakavule Ward", "Nabidongha Prison", "Nabidongha Ward", "Walugogo Ward", "Kasokoso Ward", "Buligo Ward"],
    "Northern Division": ["Nkono Ward", "Igamba Ward", "Mutukula Ward", "Nkatu Ward", "Bugumba Ward"],
  },

  // ── 008 JINJA (Jinja District) ────────────────────────────────────
  JJD: {
    "Busedde": ["Bugobya", "Itakaibolu", "Kisasi", "Nabitambala", "Nalinaibi"],
    "Kakira Town Council": ["Kakira Ward", "Karongo Ward", "Mawoito Ward", "Wairaka Ward", "Chico Ward", "Kabyaza Ward", "Mwiri Ward", "Polota Ward"],
    "Butagaya": ["Budima", "Nakakulwe (Kisozi)", "Nawampanda", "Wansiimba"],
    "Namagera Town Council": ["Namagera Ward", "Lubani Ward", "Mpumwire Ward", "Namwendwa Ward"],
    "Buwenge": ["Buweera", "Kagoma", "Kaiira", "Kitanaba", "Magamaga"],
    "Buwenge Town Council": ["Kalitunsi Ward", "Kagaire Ward", "Kasalina Ward", "Kamwani Ward"],
    "Buyengo Town Council": ["Bulugo Ward", "Butamira Ward", "Buwabuzi Ward", "Iziru Ward"],
  },

  // ── 013 KAMULI ────────────────────────────────────────────────────
  KML: {
    "Balawoli": ["Nabulezi", "Namaira"],
    "Nabwigulu": ["Nabirumba I", "Nabwigulu", "Namunyingi", "Nabirumba II"],
    "Namasagali": ["Bwiiza", "Kisaikye", "Kasozi", "Namasagali"],
    "Balawoli Town Council": ["Balawoli Northern", "Kawaga Southern"],
    "Kagumba": ["Kagumba", "Kasolwe", "Kiige", "Kibuye"],
    "Bulopa": ["Bukutu", "Bulopa", "Mpakitoni", "Nagamuli", "Nagwenyi"],
    "Butansi": ["Bugeywa", "Butansi", "Naibowa", "Naluwoli"],
    "Kitayunjwa": ["Buganza", "Butende", "Kitayunjwa", "Namaganda", "Namisambya I", "Nawango", "Nawansaso", "Budhatemwa"],
    "Namwendwa": ["Bulange", "Bulogo", "Isingo", "Kyeeya", "Makoka", "Ndalike", "Bugondha", "Kinu"],
    "Namwendwa Town Council": ["Buluuya Ward", "Busimba Ward", "Bulyango Ward", "Busejja Ward", "Mission Ward"],
    "Bugulumbya": ["Bugulumbya", "Busandha", "Nakibungulya", "Nawanende Town", "Buwoya", "Nawangoma"],
    "Kisozi": ["Kiyunga", "Kakunyu", "Namaganda", "Izaniro"],
    "Mbulamuti": ["Bugondha", "Buluya", "Kiyunga"],
    "Nawanyago": ["Bupadhengo", "Nawantumbi", "Nawanyago"],
    "Wankole": ["Lulyambuzi", "Luzinga", "Wankole"],
    "Magogo": ["Kakira", "Lwanyama", "Magogo", "Nankandulo", "Buteme", "Matumu"],
    "Kisozi Town Council": ["East Ward", "West Ward"],
    "Mbulamuti Town Council": ["Mbulamuti Ward", "Lugoloire Ward"],
    "Kasambira Town Council": ["Kasambira Ward"],
    "Nawanyago Town Council": ["Bupadhengo Urban", "Nawantumbi Urban", "Nawanyago East", "Nawanyago West"],
    "Northern Division": ["Muwebwa Ward", "Kasoigo Ward", "Buwanume Ward", "Kamuli-Sabawali", "Namisambya II Ward"],
    "Southern Division": ["Busota Ward", "Mandwa Ward", "Mulamba Ward", "Kamuli-Namwenda", "Nakulyaku Ward"],
  },

  // ── 041 BUGIRI ────────────────────────────────────────────────────
  BGR: {
    "Bulesa": ["Iggwe", "Kitodha", "Namasere", "Buluwe"],
    "Buwunga": ["Buwunga", "Kavule", "Magoola", "Luwooko", "Nambale", "Busoga", "Bupala", "Bubugo", "Mawanga"],
    "Muterere": ["Kayogera", "Bululu", "Kitumba"],
    "Nankoma": ["Isegero", "Namakoko", "Matovu", "Nsono"],
    "Budhaya": ["Budhaya", "Mayuge Rural", "Bukatu"],
    "Bulidha": ["Bulidha A", "Bulidha B", "Wakawaka", "Nabigingo", "Makoma", "Isakabusolo"],
    "Nankoma Town Council": ["Namuntenga Ward", "Masita Ward", "Nankoma Central", "Itakaibolu Ward", "Nakasita Ward", "Nankoma East", "Nawango Ward"],
    "Busowa Town Council": ["Bulume Ward", "Nawandhuki Ward", "Nabikaka Ward", "Budunduli Ward", "Nakawa Ward", "Nakidudula Ward"],
    "Buwuni Town Council": ["Buwuni Rural Ward", "Buwuni Ward", "Kasebere Ward", "Makhoma North", "Makhoma South", "Nainala Ward", "Namasere B Ward", "Nankonkolo Ward"],
    "Mutelele Town Council": ["Mutanda Ward", "Muterere East", "Busini Ward", "Lyavala Ward", "Nakasero Ward"],
    "Mayuge Town Council": ["Buwolya Ward", "Budde Ward", "Kimasa Ward", "Kololo Ward", "Nile Ward", "Mayuge Ward"],
    "Nabukalu Town Council": ["Kasita Ward", "Nakivamba Ward", "Bubalya Ward", "Bukyansiko Ward", "Kalulu Ward", "Luya Ward", "Nabukalu Ward"],
    "Buluguyi": ["Bugayi", "Nsango", "Bufunda"],
    "Iwemba": ["Buyala", "Iwemba", "Nabirere", "Bugeso", "Nambo"],
    "Kapyanga": ["Bugiri A", "Kiseitaka", "Nakavule", "Namukonge", "Ndifakulya", "Bugunga", "Bugubo"],
    "Nabukalu": ["Butyabule", "Isegero", "Nkaiza", "Wangobo", "Lwanika", "Bukubansiri"],
    "Namayemba Town Council": ["Bukonde Ward", "Gulimwoyo Ward", "Kafufu Ward", "Namabugo Ward", "Isagaza Ward", "Kasule Ward"],
    "Muwayo Town Council": ["Buluguyi Ward", "Muwayo Ward", "Buduma Ward"],
    "Eastern Division": ["Naluwerere Ward", "Nkusi Ward"],
    "Western Division": ["Ndifakulya A Ward", "Bwole Ward"],
  },

  // ── 049 MAYUGE ────────────────────────────────────────────────────
  MYG: {
    "Buwaaya": ["Buwaiswa", "Isikiro", "Buwolya", "Kabaingire", "Nsango"],
    "Kigandalo": ["Isenda", "Kigandalo", "Kioga (Mayengo)", "Kigulu", "Bugondo", "Maleka"],
    "Bukabooli": ["Bugoto", "Mayirinya", "Matovu", "Bugumia", "Bukabooli", "Buyugu"],
    "Mpungwe": ["Muggi", "Wairama", "Wamulongo", "Maina", "Buyere"],
    "Kityerera": ["Ndaiga", "Wandegeya", "Bukalenzi", "Kitovu", "Bubinge"],
    "Malongo": ["Malongo", "Namadhi", "Bukatabira", "Buluta", "Namoni", "Bumwena"],
    "Jaguzi": ["Sagitu", "Bumba", "Jaguzi", "Serinyabi", "Kaaza", "Masolya"],
    "Busakira": ["Kaluuba", "Maumu", "Butangala", "Wambete", "Bukunja"],
    "Bugadde Town Council": ["Kityerera Ward", "Bugade Ward", "Busenda Ward", "Nakibengo Ward"],
    "Bwondha Town Council": ["Bwondha Central", "Bwondha South", "Makonko Ward", "Musoma Ward", "Nalubabwe Ward", "Nkalanga Ward"],
    "Baitambogwe": ["Butte", "Katonte", "Lugolole", "Mulingilire", "Igeyero", "Lukone", "Bugodi", "Wainha"],
    "Imanyiro": ["Magada", "Mayuge", "Mbaale", "Nkombe", "Bufulubi"],
    "Mayuge Town Council": ["Ikulwe Ward", "Kavule Ward", "Kasugu Ward", "Kyebando Ward"],
    "Bukatube": ["Buyemba", "Lwanika", "Mauta", "Bukaleba", "Mbirabira"],
    "Wairasa": ["Busuyi", "Iguluibi", "Wandago", "Misoli"],
    "Magamaga Town Council": ["Magamaga Ward", "Bukoli Ward", "Wabulungu Ward", "Wandago Ward"],
  },

  // ── 064 KALIRO ────────────────────────────────────────────────────
  KLR: {
    "Bumanya": ["Bumanya", "Kasuleta", "Kyani", "Kalalu", "Namusolo", "Bulima"],
    "Gadumire": ["Bupyana", "Gadumire", "Panyolo", "Isalo", "Butambala", "Buyuge", "Tababa"],
    "Namugongo": ["Bugonza", "Butege", "Nabikoli", "Namukoge", "Natwana", "Kanakamba", "Bugoda", "Igulamubiri"],
    "Namwiwa": ["Namwiwa", "Saaka", "Kiwanabuzi", "Kiganda"],
    "Bulumba Town Council": ["Bujjejje Ward", "Londe Ward", "Masuna Ward", "Nkonte Ward", "Bulumba Central", "Nalenya Ward", "Busunga Ward"],
    "Kaliro Town Council": ["Bukumankoola", "Budini Ward", "Naigombwa Ward", "Buyunga Ward", "Lumbuye Ward"],
    "Buyinda": ["Buyinda", "Bukonde", "Kiranga", "Madibira", "Namejje"],
    "Kasokwe": ["Bwayuya", "Butajjube", "Kasokwe", "Buyodi", "Busanda"],
    "Kisinda": ["Lubulo", "Kisinda", "Busulumba", "Nawandyo", "Kibwiza", "Mpambwa"],
    "Namwiwa Town Council": ["Bukaire Ward", "Bilari Ward", "Bunswezya Ward", "Namwiwa Ward", "Busereka Ward", "Kanabugo Ward", "Wangobo Ward"],
    "Budomero": ["Budomero", "Kiyunga", "Kyanfuba", "Nabitende"],
    "Bukamba": ["Bujugu", "Buvulunguti", "Busereka", "Kitega", "Bukamba", "Nangala", "Nawampiti"],
    "Nansololo": ["Muhira", "Nantamali", "Bulike", "Buluya", "Nansololo"],
    "Nawaikoke Town Council": ["Musiha Ward", "Mwangha Ward", "Walyabira Ward", "Nombe Ward", "Bugwabi Ward", "Nawaikoke Ward"],
    "Nawaikoke": ["Buhangala", "Bupeni", "Kyambaya", "Namawa", "Nsamule"],
  },

  // ── 075 NAMUTUMBA ─────────────────────────────────────────────────
  NMT: {
    "Bulange": ["Bulange", "Bukenga", "Buwaga", "Kirerema", "Bubutya", "Kisenyi", "Nawankofu", "Mpumiro"],
    "Nsinze Town Council": ["Nsinze Ward", "Bukenhe Ward", "Bukolo Ward", "Buwongo A Ward", "Buwongo B Ward", "Buyunga Ward", "Nabukalu Ward", "Namasere Ward", "Namavundu Ward"],
    "Namutumba": ["Ituba", "Kigalama", "Nakyeere", "Namato", "Nawampandu"],
    "Nsinze": ["Bubago", "Buwongo", "Bunyagwe", "Isegero"],
    "Namutumba Town Council": ["Namutumba", "Namutumba North", "Namutumba South"],
    "Kizuba": ["Igerera", "Nakalokwe", "Nawansagwa", "Kizuba"],
    "Nawaikona": ["Bukonte", "Nawaikona", "Kivule", "Nakawunzo"],
    "Bugobi Town Council": ["Bugobi Central", "Bugobi B Ward", "Bugobi East Ward", "Bukenga Ward", "Kibigo Ward", "Town Side Ward"],
    "Bugobi": ["Buwanga", "Kibigo", "Makenha", "Nakazinga", "Kisiiro"],
    "Nabweyo": ["Budatu", "Busini", "Nabweyo"],
    "Ivukula": ["Ivukula", "Nabitula", "Budomero", "Kamudoke", "Kimenyulo", "Kirongo", "Kisewuzi"],
    "Kibaale": ["Kasozi", "Kiranga", "Kibaale", "Kisega", "Nawangisa", "Namakoko"],
    "Nangonde": ["Buwalira", "Iwungiro", "Lwatama", "Kisega", "Namakoko"],
    "Kibale Town Council": ["Mpulira Ward", "Nabisoigi Ward", "Nakyeere Ward", "Nabisoigi Central", "Bugumba Ward"],
    "Ivukula Town Council": ["Mpande Ward", "Bugabula Ward", "Gasani Ward", "Ivukula Ward", "Kakoola Ward", "Nakazinga Ward", "Nawankima Ward"],
    "Nangonde Town Council": ["Bunangwe Ward", "Butimbo Ward", "Ikwizi Ward", "Kigunda Ward", "Kitaigalwa Ward", "Nangonde Central", "Nawandaka Ward", "Iwungiro Ward", "Nangonde Ward"],
    "Kiwanyi": ["Izirangobi", "Kiwanyi", "Nabinyonyi", "Irondo", "Namalemba", "Nambula", "Mulama"],
    "Magada": ["Magada North", "Kategere", "Buyange", "Magada South"],
    "Kagulu": ["Kagulu", "Bugiri", "Irwaniro", "Nabweyo"],
    "Mazuba": ["Kagaire", "Nawanzali", "Nsoola", "Mazuba", "Isita", "Mpeizya"],
  },

  // ── 083 BUYENDE ───────────────────────────────────────────────────
  BYD: {
    "Bukungu Town Council": ["Kibaale Ward", "Kyankoole Ward", "Bukungu Ward"],
    "Buyende": ["Mango", "Namusita", "Kakooge", "Kiribairya", "Ikanda"],
    "Kidera Town Council": ["Itamia Ward", "Kabugudho Ward", "Kitaidhumba Ward", "Kitete Ward", "Kidera Ward"],
    "Kidera": ["Kisaikye", "Kasiira", "Miseru", "Bulembo", "Ndudu"],
    "Nkondo": ["Nsekaseka", "Iringa West", "Immeri", "Kigingi", "Ndulya", "Malima", "Iringa East", "Kiwaba"],
    "Buyende Town Council": ["Buyende Ward", "Kinambogo Ward", "Nakabira Ward", "Bumyuka Ward", "Makanga Ward"],
    "Ndolwa": ["Nabigaga", "Butongole", "Ndolwa", "Wesunire"],
    "Buyanja": ["Butayunjwa", "Buyanja", "Ntaala"],
    "Bugaya": ["Bugaya", "Butaswa", "Namusikizi", "Busaabi", "Iraapa", "Kigweri", "Namukunyu"],
    "Irundu Town Council": ["Bugulusi Ward", "Kagwa Ward", "Kanaku Ward", "Irundu Ward"],
    "Kagulu": ["Bumugoli", "Iyingo", "Kabukye", "Kagulu", "Buyumba", "Kirimwa", "Mulali", "Nsomba"],
    "Gumpi": ["Gumpi", "Kitukiro", "Budola", "Innula", "Kimbaya", "Nabitula"],
    "Irundu": ["Bukutula", "Nkoone", "Budipa", "Igalaza"],
    "Ngandho": ["Gwase", "Ngandho", "Wandago", "Buyamba", "Kirimbi", "Nabisiki"],
  },

  // ── 094 LUUKA ─────────────────────────────────────────────────────
  LUK: {
    "Bukooma": ["Bukooma", "Bukyangwa", "Naigobya", "Namansenda", "Namulanda"],
    "Bulongo": ["Budhabangula", "Bugonyoka", "Bukendi", "Bulongo", "Nakabugu", "Namalemba"],
    "Ikumbya": ["Bunafu", "Ikumbya", "Inuula", "Nawaka", "Ntayigirwa"],
    "Bukoova Town Council": ["Bukanha Ward", "Bunabala Ward", "Nawansega Ward", "Bukoova Central", "Bukoova Rural", "Busanda Ward", "Butaserwa Ward", "Buyoga Ward", "Makuutu Ward", "Nabyoto Ward"],
    "Luuka Town Council": ["Kiyunga Ward", "Lwada Ward", "Busimawu Ward", "Kitwekyambogo", "Busonga Ward"],
    "Bukanga": ["Budondo", "Buwologoma", "Kiroba", "Nabubya", "Namukubembe"],
    "Irongo": ["Kalyowa", "Kibinga", "Kyanvuma", "Irongo", "Nawanyago"],
    "Nawampiti": ["Bugomba", "Buyoola", "Nakiswiga", "Nawampiti", "Nawankompe"],
    "Waibuga": ["Busiiro", "Butimbwa", "Itakaibolu", "Lwaki"],
    "Bulanga Town Council": ["Bulanga Ward", "Itwe Ward", "Nantamu Ward", "Mawundo Ward", "Walibo Ward"],
    "Busalamu Town Council": ["Busalamu East", "Busalamu North", "Busalamu South", "Busalamu West"],
    "Kyanvuma Town Council": ["Buniko Ward", "Magada Ward", "Nakabaale Ward", "Nakabambwe Ward", "Nsimakatono Ward"],
  },

  // ── 095 NAMAYINGO ─────────────────────────────────────────────────
  NMY: {
    "Buswale": ["Buswale", "Nansuma", "Madowa", "Namayuge", "Bubango", "Bungecha"],
    "Buyinja": ["Gondohera", "Kifuyo", "Lwangosia", "Syanyonja", "Nsono"],
    "Namayingo Town Council": ["Bulamba Ward", "Namayingo Central", "Budidi Ward", "Nambugu Ward", "Nasinu Ward"],
    "Bukana": ["Bugana", "Biisa", "Buduma"],
    "Lolwe": ["Hama", "Lolwe West", "Lolwe East"],
    "Sigulu Islands": ["Sigulu Manga", "Rabachi", "Sigulu Mukani", "Nampongwe", "Bumalenge"],
    "Banda": ["Lugala", "Bujwanga", "Buchumba"],
    "Banda Town Council": ["Buwoya Ward", "Bukeda Ward", "Buyombo Ward", "Magooli Ward", "Nangera Ward", "Lutolo Ward"],
    "Mutumba": ["Mwema", "Buchimo", "Lubango"],
    "Buhemba": ["Buhemba", "Buwongo", "Bukewa", "Dohwe", "Sinde"],
    "Mutumba Town Council": ["Hatumba Banja", "Bulule Ward", "Lubira Ward", "Mutumba North", "Mawa Ward", "Mutumba South"],
  },

  // ── 123 BUGWERI ───────────────────────────────────────────────────
  BGW: {
    "Buyanga": ["Bulunguli", "Bumoozi", "Buwooya", "Bwigula", "Kalalu", "Lubira"],
    "Ibulanku": ["Buniantole", "Ibulanku", "Namiganda", "Nawansega", "Nsaale"],
    "Makuutu": ["Kasozi", "Kigulamo", "Makandwa", "Makuutu"],
    "Namalemba": ["Idinda", "Minani", "Namalemba", "Namunyumya"],
    "Busembatia Town Council": ["Busembatia", "Busembatia Market", "Buyirima Ward", "Kakoge Ward", "Majengo Ward"],
    "Igombe": ["Bubenge", "Igombe", "Kikunyu", "Walanga"],
    "Idudi Town Council": ["Idudi A Ward", "Mifumi Ward", "Kikunyu Ward", "Idudi B Ward", "Idudi C Ward", "Idudi D Ward"],
    "Busesa Town Council": ["Ibaako Ward", "Butende Ward", "Walutente Ward"],
  },

  // ── 138 JINJA CITY ────────────────────────────────────────────────
  JJA: {
    "Jinja South Division": ["Central Jinja East", "Old Boma Ward", "Masese Ward", "Walukuba East", "Walukuba West", "Central Jinja West", "Maggwa Ward", "Kimaka Ward", "Mpumudde Ward", "Nalufenya Ward", "Lubaga Ward"],
    "Jinja North Division": ["Buwagi (Kakyomya)", "Ivunamba Ward", "Kibibi Ward", "Namizi Ward", "Nawangoma Ward", "Budhumbuli East", "Buwekula Ward", "Buwenda TC Ward", "Mafubira Ward", "Namulesa Ward", "Wanyange Ward", "Budhumbuli West", "Katende Ward", "Nakanyonyi Ward", "Wanyama Ward"],
  },
};
