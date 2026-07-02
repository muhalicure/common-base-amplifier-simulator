const params = [
  { key: "VCC", label: "V_CC", unit: "V", min: 3, max: 24, step: 0.5, val: 12, digits: 1 },
  { key: "VEE", label: "|V_EE|", unit: "V", min: 0, max: 24, step: 0.5, val: 5, digits: 1 },
  { key: "RE", label: "R_E", unit: "kΩ", min: 0.2, max: 10, step: 0.1, val: 2.2, digits: 2 },
  { key: "RC", label: "R_C", unit: "kΩ", min: 0.2, max: 10, step: 0.1, val: 3.3, digits: 2 },
  { key: "RL", label: "R_L", unit: "kΩ", min: 0.5, max: 20, step: 0.5, val: 5, digits: 1 },
  { key: "Rs", label: "R_s", unit: "Ω", min: 0, max: 600, step: 10, val: 50, digits: 0 },
  { key: "beta", label: "β (h_FE)", unit: "", min: 50, max: 300, step: 5, val: 150, digits: 0 },
  { key: "VBE", label: "V_BE", unit: "V", min: 0.5, max: 0.8, step: 0.01, val: 0.7, digits: 2 },
  { key: "C1", label: "C1", unit: "µF", min: 0.1, max: 100, step: 0.1, val: 10, digits: 1 },
  { key: "C2", label: "C2", unit: "µF", min: 0.1, max: 100, step: 0.1, val: 10, digits: 1 }
];

const scenarios = {
  aktif: {
    title: "Aktif bölge senaryosu yüklendi.",
    values: {
      VCC: 12,
      VEE: 5,
      RE: 2.2,
      RC: 3.3,
      RL: 5,
      Rs: 50,
      beta: 150,
      VBE: 0.7,
      C1: 10,
      C2: 10
    }
  },

  doyma: {
    title: "Doyma bölgesi senaryosu yüklendi. Kolektör beslemesi sınırlı kaldığı için transistör doyuma zorlanır.",
    values: {
      VCC: 3,
      VEE: 12,
      RE: 0.8,
      RC: 8,
      RL: 5,
      Rs: 50,
      beta: 150,
      VBE: 0.7,
      C1: 10,
      C2: 10
    }
  },

  kesim: {
    title: "Kesim bölgesi senaryosu yüklendi. Negatif besleme V_BE değerini aşmadığı için emiter akımı oluşmaz.",
    values: {
      VCC: 12,
      VEE: 0.5,
      RE: 2.2,
      RC: 3.3,
      RL: 5,
      Rs: 50,
      beta: 150,
      VBE: 0.7,
      C1: 10,
      C2: 10
    }
  },

  dusukFL: {
    title: "Düşük fL senaryosu yüklendi. Büyük kuplaj kapasitörleri alt kesim frekansını aşağı çeker.",
    values: {
      VCC: 12,
      VEE: 5,
      RE: 2.2,
      RC: 3.3,
      RL: 5,
      Rs: 50,
      beta: 150,
      VBE: 0.7,
      C1: 68,
      C2: 68
    }
  }
};

const state = Object.fromEntries(params.map((p) => [p.key, p.val]));

const VT = 0.026;
const VCE_SAT = 0.2;

const slidersDiv = document.getElementById("sliders");
const scenarioStatus = document.getElementById("scenarioStatus");

const saveExperimentBtn = document.getElementById("saveExperimentBtn");
const clearExperimentsBtn = document.getElementById("clearExperimentsBtn");
const experimentEmpty = document.getElementById("experimentEmpty");
const experimentTableBody = document.getElementById("experimentTableBody");
const experimentTableWrap = document.querySelector(".experiment-table-wrap");

const interpretationStatus = document.getElementById("interpretationStatus");
const dcInterpretation = document.getElementById("dcInterpretation");
const gainInterpretation = document.getElementById("gainInterpretation");
const frequencyInterpretation = document.getElementById("frequencyInterpretation");
const recommendationInterpretation = document.getElementById("recommendationInterpretation");

const experiments = [];
let currentResult = null;

function fmt(x, d = 3) {
  if (!Number.isFinite(x)) return "—";

  if (Math.abs(x) >= 1000) {
    return x.toFixed(0);
  }

  return x.toFixed(d);
}

function inputFormat(p, value) {
  return Number(value).toFixed(p.digits);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cards(items) {
  return items
    .map(
      ([k, v]) => `
        <div class="resitem">
          <span class="k">${k}</span>
          <span class="v">${v}</span>
        </div>
      `
    )
    .join("");
}

function createLogStep(number, title, detail, formula, type = "") {
  return `
    <div class="log-step ${type}">
      <div class="log-number">${number}</div>

      <div class="log-content">
        <p class="log-title">${title}</p>
        <p class="log-detail">${detail}</p>
        ${formula ? `<span class="log-formula">${formula}</span>` : ""}
      </div>
    </div>
  `;
}

function clearSelectedScenario() {
  document.querySelectorAll(".scenario-card").forEach((card) => {
    card.classList.remove("active");
  });

  scenarioStatus.textContent =
    "Özel parametre durumu kullanılıyor. Sonuçlar canlı hesaplanmaktadır.";
}

function syncInputValues() {
  params.forEach((p) => {
    const range = document.getElementById(`in_${p.key}`);
    const number = document.getElementById(`num_${p.key}`);

    if (range) {
      range.value = state[p.key];
    }

    if (number) {
      number.value = inputFormat(p, state[p.key]);
    }
  });
}

function applyScenario(name) {
  const scenario = scenarios[name];

  if (!scenario) return;

  Object.entries(scenario.values).forEach(([key, value]) => {
    state[key] = value;
  });

  syncInputValues();

  document.querySelectorAll(".scenario-card").forEach((card) => {
    card.classList.remove("active");
  });

  const selectedCard = document.querySelector(
    `.scenario-card[data-scenario="${name}"]`
  );

  if (selectedCard) {
    selectedCard.classList.add("active");
  }

  scenarioStatus.textContent = scenario.title;

  compute();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function renderExperiments() {
  if (experiments.length === 0) {
    experimentEmpty.style.display = "block";
    experimentTableWrap.style.display = "none";
    experimentTableBody.innerHTML = "";
    return;
  }

  experimentEmpty.style.display = "none";
  experimentTableWrap.style.display = "block";

  experimentTableBody.innerHTML = experiments
    .map(
      (record, index) => `
        <tr>
          <td>${index + 1}</td>

          <td>
            <span class="region-badge ${record.regionClass}">
              ${record.region}
            </span>
          </td>

          <td>${record.VCC.toFixed(1)} V</td>
          <td>${record.VEE.toFixed(1)} V</td>
          <td>${record.RC.toFixed(2)} kΩ</td>
          <td>${record.RE.toFixed(2)} kΩ</td>
          <td>${fmt(record.IC * 1000)} mA</td>
          <td>${fmt(record.VCE)} V</td>

          <td>
            ${
              record.regionClass === "aktif"
                ? `${fmt(record.fL, 1)} Hz`
                : "—"
            }
          </td>

          <td>
            ${
              record.regionClass === "aktif"
                ? `${fmt(record.KvfLdB, 2)} dB`
                : "—"
            }
          </td>

          <td>
            <button
              class="delete-record-btn"
              type="button"
              data-delete-index="${index}"
            >
              Sil
            </button>
          </td>
        </tr>
      `
    )
    .join("");
}

function saveExperiment() {
  if (!currentResult) return;

  experiments.push({
    VCC: state.VCC,
    VEE: state.VEE,
    RC: state.RC,
    RE: state.RE,

    IC: currentResult.IC,
    VCE: currentResult.VCE,
    fL: currentResult.fL,
    KvfLdB: currentResult.KvfLdB,

    region: currentResult.region,
    regionClass: currentResult.regionClass
  });

  renderExperiments();

  saveExperimentBtn.textContent = "Kaydedildi ✓";

  setTimeout(() => {
    saveExperimentBtn.textContent = "Mevcut Durumu Kaydet";
  }, 900);
}

function renderAnalysisLog(data) {
  const {
    VB,
    VE,
    IE,
    IC,
    IB,
    VC,
    VCE,
    VCB,
    region,
    regionClass,
    re,
    RinE,
    RCL,
    fc1,
    fc2,
    fL,
    KvfLdB
  } = data;

  const log = document.getElementById("analysisLog");

  let html = "";

  html += createLogStep(
    1,
    "Baz gerilimi belirlendi",
    "Ortak baz topolojisinde baz ucu doğrudan toprağa bağlı kabul edilmiştir.",
    `V_B = ${fmt(VB)} V`
  );

  html += createLogStep(
    2,
    "Emiter gerilimi hesaplandı",
    "Baz-emiter gerilimi kullanılarak emiter düğümündeki DC gerilim bulunmuştur.",
    `V_E = V_B - V_BE = ${fmt(VE)} V`
  );

  if (regionClass === "kesim") {
    html += createLogStep(
      3,
      "Emiter akımı kontrol edildi",
      "Negatif besleme V_BE değerini aşamadığı için emiter akımı oluşmamıştır.",
      `I_E ≈ ${fmt(IE * 1000)} mA`,
      "bad-step"
    );

    html += createLogStep(
      4,
      "Çalışma bölgesi belirlendi",
      "Transistör kesim bölgesindedir. Bu nedenle AC küçük-sinyal analizi uygulanmaz.",
      region,
      "bad-step"
    );

    log.innerHTML = html;
    return;
  }

  html += createLogStep(
    3,
    "Emiter akımı hesaplandı",
    "Emiter direnci ve negatif besleme kullanılarak DC emiter akımı bulunmuştur.",
    `I_E = (|V_EE| - V_BE) / R_E = ${fmt(IE * 1000)} mA`
  );

  html += createLogStep(
    4,
    "Kolektör ve baz akımları hesaplandı",
    "Aktif bölgede α = β / (β + 1) kabulü kullanılmıştır.",
    `I_C = ${fmt(IC * 1000)} mA · I_B = ${fmt(IB * 1e6)} µA`
  );

  html += createLogStep(
    5,
    "Kolektör gerilimi hesaplandı",
    "Kolektör direnci üzerindeki gerilim düşümü çıkarılarak kolektör gerilimi bulunmuştur.",
    `V_C = V_CC - I_C·R_C = ${fmt(VC)} V`
  );

  if (regionClass === "aktif") {
    html += createLogStep(
      6,
      "Çalışma bölgesi doğrulandı",
      "VCE yeterince büyük ve kolektör-baz birleşimi ters polarmalı olduğu için transistör aktif bölgede çalışmaktadır.",
      `V_CE = ${fmt(VCE)} V · V_CB = ${fmt(VCB)} V`,
      "active-step"
    );

    html += createLogStep(
      7,
      "Küçük-sinyal emiter direnci hesaplandı",
      "Aktif bölgedeki emiter akımından dinamik emiter direnci hesaplanmıştır.",
      `r_e = V_T / I_E = ${fmt(re)} Ω`,
      "active-step"
    );

    html += createLogStep(
      8,
      "Giriş ve çıkış eşdeğer dirençleri hesaplandı",
      "C1 ve C2 kapasitörlerinin gördüğü dirençler alçak frekans analizi için belirlenmiştir.",
      `R_in = ${fmt(RinE)} Ω · R_C||R_L = ${fmt(RCL)} Ω`
    );

    html += createLogStep(
      9,
      "Köşe frekansları hesaplandı",
      "C1 ve C2 kapasitörlerinin oluşturduğu ayrı köşe frekansları bulunmuştur.",
      `f_c1 = ${fmt(fc1, 1)} Hz · f_c2 = ${fmt(fc2, 1)} Hz`
    );

    html += createLogStep(
      10,
      "Alt kesim frekansı ve kazanç belirlendi",
      "Daha baskın olan köşe frekansı alt kesim frekansı olarak alınmıştır.",
      `f_L = ${fmt(fL, 1)} Hz · |K_v(f_L)| = ${fmt(KvfLdB, 2)} dB`,
      "active-step"
    );
  } else {
    html += createLogStep(
      6,
      "Çalışma bölgesi belirlendi",
      "Aktif bölge varsayımında kolektör-emiter gerilimi yeterli çıkmadığı için transistör doyuma girmiştir.",
      `V_CE ≈ ${fmt(VCE)} V`,
      "warn-step"
    );

    html += createLogStep(
      7,
      "AC analizi durduruldu",
      "Küçük-sinyal AC analiz formülleri aktif bölge için geçerli olduğundan frekans analizi gösterilmemektedir.",
      "AC analiz için aktif bölge gereklidir.",
      "warn-step"
    );
  }

  log.innerHTML = html;
}

function renderInterpretation(data) {
  const {
    region,
    regionClass,
    IE,
    IC,
    VCE,
    VCB,
    re,
    Avmid,
    AvmidDb,
    fc1,
    fc2,
    fL,
    KvfLdB,
    C1,
    C2,
    RC,
    RE,
    VEE
  } = data;

  if (regionClass === "aktif") {
    interpretationStatus.textContent =
      "Devre aktif bölgede. DC ve küçük-sinyal AC sonuçları birlikte değerlendirildi.";

    dcInterpretation.innerHTML = `
      <p>
        Transistör <strong>aktif bölgede</strong> çalışmaktadır. Bu, ortak baz
        yükseltecin lineer yükseltme yapabildiği uygun çalışma durumudur.
      </p>

      <ul class="interpretation-list success">
        <li>
          Emiter akımı:
          <span class="interpretation-value">${fmt(IE * 1000)} mA</span>
        </li>

        <li>
          Kolektör akımı:
          <span class="interpretation-value">${fmt(IC * 1000)} mA</span>
        </li>

        <li>
          Kolektör-emiter gerilimi:
          <span class="interpretation-value">${fmt(VCE)} V</span>
        </li>

        <li>
          Kolektör-baz gerilimi:
          <span class="interpretation-value">${fmt(VCB)} V</span>
        </li>
      </ul>
    `;

    let gainComment = "";

    if (AvmidDb >= 40) {
      gainComment =
        "Orta-bant gerilim kazancı oldukça yüksektir. Bu sonuç, emiter dinamik direncinin düşük ve kolektör tarafındaki eşdeğer direncin yeterli olduğunu gösterir.";
    } else if (AvmidDb >= 20) {
      gainComment =
        "Orta-bant kazancı kullanılabilir seviyededir. RC veya yük direnci değiştirildiğinde kazanç daha da artırılabilir.";
    } else {
      gainComment =
        "Orta-bant kazancı düşük seviyededir. Daha yüksek kazanç için çalışma akımı ve kolektör tarafındaki eşdeğer direnç yeniden değerlendirilmelidir.";
    }

    gainInterpretation.innerHTML = `
      <p>
        Orta-bant kazancı yaklaşık
        <span class="interpretation-value">${fmt(Avmid)} V/V</span>
        yani
        <span class="interpretation-value">${fmt(AvmidDb, 2)} dB</span>
        değerindedir.
      </p>

      <p>${gainComment}</p>

      <ul class="interpretation-list">
        <li>
          Dinamik emiter direnci:
          <span class="interpretation-value">${fmt(re)} Ω</span>
        </li>

        <li>
          RC değeri:
          <span class="interpretation-value">${fmt(RC, 2)} kΩ</span>
        </li>
      </ul>
    `;

    let dominantFrequencyText = "";

    if (fc1 > fc2) {
      dominantFrequencyText =
        "Alt kesim frekansını daha çok C1 giriş kuplaj kapasitörü belirlemektedir.";
    } else if (fc2 > fc1) {
      dominantFrequencyText =
        "Alt kesim frekansını daha çok C2 çıkış kuplaj kapasitörü belirlemektedir.";
    } else {
      dominantFrequencyText =
        "C1 ve C2 kapasitörlerinin köşe frekansları birbirine yakındır.";
    }

    let frequencyQuality = "";

    if (fL < 30) {
      frequencyQuality =
        "Alt kesim frekansı düşüktür. Devre düşük frekanslı işaretleri daha rahat yükseltebilir.";
    } else if (fL < 300) {
      frequencyQuality =
        "Alt kesim frekansı orta seviyededir. Genel amaçlı yükseltme için dengeli bir sonuç oluşmuştur.";
    } else {
      frequencyQuality =
        "Alt kesim frekansı yüksektir. Çok düşük frekanslı giriş işaretlerinde kazanç düşüşü daha belirgin olur.";
    }

    frequencyInterpretation.innerHTML = `
      <p>
        <span class="interpretation-value">f_c1 = ${fmt(fc1, 1)} Hz</span>
        ve
        <span class="interpretation-value">f_c2 = ${fmt(fc2, 1)} Hz</span>
        hesaplanmıştır.
      </p>

      <p>
        Devrenin alt kesim frekansı
        <span class="interpretation-value">f_L = ${fmt(fL, 1)} Hz</span>
        değerindedir.
      </p>

      <ul class="interpretation-list warning">
        <li>${dominantFrequencyText}</li>
        <li>${frequencyQuality}</li>
        <li>
          fL noktasındaki kazanç:
          <span class="interpretation-value">${fmt(KvfLdB, 2)} dB</span>
        </li>
      </ul>
    `;

    let capacitorRecommendation = "";

    if (fL > 300) {
      capacitorRecommendation =
        `fL değerini azaltmak için özellikle baskın kapasitörün değeri artırılabilir. Mevcut C1=${fmt(C1, 1)} µF ve C2=${fmt(C2, 1)} µF değerleri bu amaçla büyütülebilir.`;
    } else if (fL < 30) {
      capacitorRecommendation =
        "Alt kesim frekansı zaten düşüktür. Daha küçük kapasitör değerleri kullanılarak maliyet ve fiziksel boyut azaltılabilir.";
    } else {
      capacitorRecommendation =
        "C1 ve C2 değerleri düşük frekans performansı açısından dengeli görünmektedir.";
    }

    recommendationInterpretation.innerHTML = `
      <ul class="interpretation-list success">
        <li>
          Devre lineer yükseltme için aktif bölgede tutulmalıdır.
        </li>

        <li>
          ${capacitorRecommendation}
        </li>

        <li>
          Kazancı yükseltmek için RC artırılabilir; ancak VCE değerinin doyuma yaklaşmaması kontrol edilmelidir.
        </li>

        <li>
          VEE=${fmt(VEE, 1)} V ve RE=${fmt(RE, 2)} kΩ değerleri emiter akımını belirlediği için birlikte değerlendirilmelidir.
        </li>
      </ul>
    `;

    return;
  }

  if (regionClass === "doyma") {
    interpretationStatus.textContent =
      "Devre doyma bölgesinde. Lineer küçük-sinyal yükseltme koşulları sağlanmıyor.";

    dcInterpretation.innerHTML = `
      <p>
        Transistör <strong>doyma bölgesindedir</strong>. Kolektör-emiter gerilimi
        çok düşük olduğu için kolektör akımı artık yalnızca β ile belirlenmez.
      </p>

      <ul class="interpretation-list warning">
        <li>
          VCE yaklaşık:
          <span class="interpretation-value">${fmt(VCE)} V</span>
        </li>

        <li>
          Kolektör-baz gerilimi:
          <span class="interpretation-value">${fmt(VCB)} V</span>
        </li>

        <li>
          Emiter akımı:
          <span class="interpretation-value">${fmt(IE * 1000)} mA</span>
        </li>
      </ul>
    `;

    gainInterpretation.innerHTML = `
      <p>
        Doyma bölgesinde transistör lineer yükselteç gibi davranmaz. Bu nedenle
        orta-bant gerilim kazancı güvenilir biçimde yorumlanamaz.
      </p>

      <ul class="interpretation-list warning">
        <li>Çıkış işaretinde bozulma oluşabilir.</li>
        <li>Girişteki küçük değişimler çıkışa lineer aktarılmaz.</li>
        <li>AC küçük-sinyal modeli bu bölge için geçerli değildir.</li>
      </ul>
    `;

    frequencyInterpretation.innerHTML = `
      <p>
        Doyma bölgesinde AC küçük-sinyal analizi gösterilmez. Bu nedenle
        f<sub>c1</sub>, f<sub>c2</sub> ve f<sub>L</sub> sonuçları bu çalışma
        durumu için anlamlı kabul edilmez.
      </p>

      <ul class="interpretation-list warning">
        <li>Önce devre aktif bölgeye taşınmalıdır.</li>
        <li>Ardından frekans tepkisi değerlendirilmelidir.</li>
      </ul>
    `;

    recommendationInterpretation.innerHTML = `
      <ul class="interpretation-list warning">
        <li>
          RC değeri azaltılarak kolektör üzerindeki gerilim düşümü düşürülebilir.
        </li>

        <li>
          VCC artırılarak kolektör için daha fazla gerilim payı oluşturulabilir.
        </li>

        <li>
          VEE azaltılabilir veya RE artırılabilir; böylece emiter akımı düşer.
        </li>

        <li>
          Amaç, VCE değerini doyumdan çıkaracak şekilde aktif bölgeye taşımaktır.
        </li>
      </ul>
    `;

    return;
  }

  interpretationStatus.textContent =
    "Devre kesim bölgesinde. Emiter akımı oluşmadığı için yükseltme yapılamıyor.";

  dcInterpretation.innerHTML = `
    <p>
      Transistör <strong>kesim bölgesindedir</strong>. Baz-emiter birleşimi
      iletime geçmediği için emiter ve kolektör akımları yaklaşık sıfırdır.
    </p>

    <ul class="interpretation-list danger">
      <li>
        Emiter akımı:
        <span class="interpretation-value">${fmt(IE * 1000)} mA</span>
      </li>

      <li>
        Kolektör akımı:
        <span class="interpretation-value">${fmt(IC * 1000)} mA</span>
      </li>

      <li>
        VCE değeri:
        <span class="interpretation-value">${fmt(VCE)} V</span>
      </li>
    </ul>
  `;

  gainInterpretation.innerHTML = `
    <p>
      Kesim bölgesinde emiter akımı oluşmadığı için dinamik emiter direnci
      hesaplanamaz. Bu nedenle devrenin gerilim kazancı aktif bölgedeki gibi
      tanımlanamaz.
    </p>

    <ul class="interpretation-list danger">
      <li>Transistör yükseltme yapmaz.</li>
      <li>Çıkışta anlamlı bir küçük-sinyal kazancı oluşmaz.</li>
      <li>Orta-bant kazanç hesabı uygulanmaz.</li>
    </ul>
  `;

  frequencyInterpretation.innerHTML = `
    <p>
      Kesim bölgesinde küçük-sinyal modeli geçerli değildir. Bu nedenle
      frekans tepkisi ve fL grafiği gösterilmez.
    </p>

    <ul class="interpretation-list danger">
      <li>Önce DC kutuplama koşulu sağlanmalıdır.</li>
      <li>Aktif bölgeye geçildiğinde frekans analizi otomatik açılır.</li>
    </ul>
  `;

  recommendationInterpretation.innerHTML = `
    <ul class="interpretation-list danger">
      <li>
        |VEE| değeri VBE değerinden büyük olmalıdır.
      </li>

      <li>
        Emiter akımı oluşturmak için negatif besleme artırılabilir.
      </li>

      <li>
        RE çok büyükse emiter akımı düşük kalabilir; uygun bir değer seçilmelidir.
      </li>

      <li>
        Devre aktif bölgeye geçtikten sonra kazanç ve fL tekrar değerlendirilmelidir.
      </li>
    </ul>
  `;
}

function compute() {
  const { VCC, VEE, RE, RC, RL, Rs, beta, VBE, C1, C2 } = state;

  const REo = RE * 1000;
  const RCo = RC * 1000;
  const RLo = RL * 1000;

  const VB = 0;
  const alpha = beta / (beta + 1);

  let VE = VB - VBE;
  let VBEreal = VBE;

  let IE = 0;
  let IC = 0;
  let IB = 0;
  let VC = VCC;
  let VCE = 0;
  let VCB = 0;

  let region = "";
  let regionClass = "";
  let reason = "";

  let re = null;
  let RinE = null;
  let RCL = null;
  let Avmid = null;
  let fc1 = null;
  let fc2 = null;
  let fL = null;
  let KvfLdB = null;
  let AvmidDb = null;

  const IEactive = (VEE - VBE) / REo;

  if (IEactive <= 1e-9) {
    region = "KESİM BÖLGESİ";
    regionClass = "kesim";

    VE = VB;
    VBEreal = 0;
    VCE = VCC;
    VCB = VCC;

    reason =
      "Negatif besleme büyüklüğü V_BE değerini aşamadığı için emiter akımı oluşmamaktadır. Transistör kesim bölgesindedir.";
  } else {
    const ICactive = alpha * IEactive;
    const VCactive = VCC - ICactive * RCo;
    const VCEactive = VCactive - VE;
    const VCBactive = VCactive - VB;

    if (VCEactive > VCE_SAT && VCBactive > 0) {
      region = "AKTİF BÖLGE";
      regionClass = "aktif";

      IE = IEactive;
      IC = ICactive;
      IB = IE - IC;
      VC = VCactive;
      VCE = VCEactive;
      VCB = VCBactive;

      reason = `V_CE = ${fmt(VCE)} V ve V_CB = ${fmt(
        VCB
      )} V olduğundan kolektör-baz birleşimi ters polarmalıdır. Transistör aktif bölgede çalışmaktadır.`;

      re = VT / IE;
      RinE = (REo * re) / (REo + re);
      RCL = (RCo * RLo) / (RCo + RLo);

      Avmid = RCL / re;

      fc1 = 1 / (2 * Math.PI * (Rs + RinE) * (C1 * 1e-6));
      fc2 = 1 / (2 * Math.PI * (RCo + RLo) * (C2 * 1e-6));

      fL = Math.max(fc1, fc2);

      const w = 2 * Math.PI * fL;
      const w1 = 2 * Math.PI * fc1;
      const w2 = 2 * Math.PI * fc2;

      const mag1 = w / Math.sqrt(w * w + w1 * w1);
      const mag2 = w / Math.sqrt(w * w + w2 * w2);

      const KvfL = Avmid * mag1 * mag2;

      KvfLdB = 20 * Math.log10(Math.abs(KvfL));
      AvmidDb = 20 * Math.log10(Math.abs(Avmid));
    } else {
      region = "DOYMA BÖLGESİ";
      regionClass = "doyma";

      IE = IEactive;
      VC = VE + VCE_SAT;
      VCE = VCE_SAT;
      VCB = VC - VB;

      IC = Math.max(0, (VCC - VC) / RCo);
      IB = Math.max(0, IE - IC);

      reason = `Aktif bölge varsayımında V_CE yeterli çıkmadığı için transistör doyuma girmiştir. Doyumda V_CE yaklaşık ${VCE_SAT} V kabul edilmiştir.`;
    }
  }

  currentResult = {
    VCC,
    VEE,
    RE,
    RC,
    RL,
    Rs,
    beta,
    VBE,
    C1,
    C2,

    VB,
    VE,
    VBEreal,

    IE,
    IC,
    IB,

    VC,
    VCE,
    VCB,

    region,
    regionClass,

    re,
    RinE,
    RCL,
    Avmid,
    AvmidDb,
    fc1,
    fc2,
    fL,
    KvfLdB
  };

  document.getElementById("dcResults").innerHTML = cards([
    ["I_B", `${fmt(IB * 1e6)} µA`],
    ["I_C", `${fmt(IC * 1e3)} mA`],
    ["I_E", `${fmt(IE * 1e3)} mA`],
    ["V_CE", `${fmt(VCE)} V`],
    ["V_CB", `${fmt(VCB)} V`],
    ["V_BE", `${fmt(VBEreal)} V`]
  ]);

  const regionBox = document.getElementById("regionBox");
  regionBox.textContent = region;
  regionBox.className = `region ${regionClass}`;

  const detail = document.getElementById("regionDetail");
  detail.textContent = reason;
  detail.className = `region-detail ${regionClass}`;

  if (regionClass === "aktif") {
    document.getElementById("acResults").innerHTML = cards([
      ["r_e (iç direnç)", `${fmt(re)} Ω`],
      ["A_v (orta-bant)", `${fmt(Avmid)} (${fmt(AvmidDb, 2)} dB)`],
      ["f_c1", `${fmt(fc1, 1)} Hz`],
      ["f_c2", `${fmt(fc2, 1)} Hz`],
      ["f_L", `${fmt(fL, 1)} Hz`],
      ["|K_v(f_L)|", `${fmt(KvfLdB, 2)} dB`]
    ]);
  } else {
    document.getElementById("acResults").innerHTML = cards([
      ["r_e (iç direnç)", "—"],
      ["A_v (orta-bant)", "—"],
      ["f_c1", "—"],
      ["f_c2", "—"],
      ["f_L", "—"],
      ["|K_v(f_L)|", "—"]
    ]);
  }

  renderAnalysisLog(currentResult);
  renderInterpretation(currentResult);

  drawMain();

  drawDC(
    VCC,
    VEE,
    RE,
    RC,
    IE,
    IC,
    IB,
    VCE,
    VCB,
    VBEreal,
    VC,
    VE
  );

  if (regionClass === "aktif") {
    drawAC(Rs, RinE, RCL, Avmid, fc1, fc2, fL, KvfLdB, true);
    drawFrequencyGraph(Avmid, AvmidDb, fc1, fc2, fL);
  } else {
    drawAC(null, null, null, null, null, null, null, null, false);
    drawFrequencyGraph(null, null, null, null, null);
  }
}

function drawFrequencyGraph(Avmid, AvmidDb, fc1, fc2, fL) {
  const svg = document.getElementById("svgFrequency");
  const note = document.getElementById("frequencyNote");

  clearSvg(svg);

  if (!Number.isFinite(Avmid) || !Number.isFinite(fL)) {
    label(
      svg,
      450,
      160,
      "Frekans tepkisi yalnızca aktif bölgede gösterilir.",
      {
        fill: "#ffb454",
        "font-size": 17
      }
    );

    label(
      svg,
      450,
      190,
      "Aktif bölgeye geçmek için VEE, RE veya RC değerlerini değiştir.",
      {
        fill: "#8b98a5",
        "font-size": 13
      }
    );

    note.textContent =
      "Transistör aktif bölgede olmadığı için küçük-sinyal frekans analizi uygulanmamaktadır.";

    return;
  }

  const width = 900;
  const height = 360;

  const left = 80;
  const right = 42;
  const top = 34;
  const bottom = 62;

  const graphWidth = width - left - right;
  const graphHeight = height - top - bottom;

  const minFreq = Math.max(0.1, Math.min(fc1, fc2, fL) / 100);
  const maxFreq = Math.max(100000, fL * 100);

  const minLog = Math.log10(minFreq);
  const maxLog = Math.log10(maxFreq);

  const points = [];

  for (let i = 0; i <= 120; i++) {
    const logF = minLog + (maxLog - minLog) * (i / 120);
    const f = 10 ** logF;

    const w = 2 * Math.PI * f;
    const w1 = 2 * Math.PI * fc1;
    const w2 = 2 * Math.PI * fc2;

    const h1 = w / Math.sqrt(w * w + w1 * w1);
    const h2 = w / Math.sqrt(w * w + w2 * w2);

    const gain = Avmid * h1 * h2;
    const gainDb = 20 * Math.log10(Math.abs(gain));

    points.push({ f, gainDb });
  }

  const lowestDb = Math.min(...points.map((p) => p.gainDb));
  const highestDb = Math.max(...points.map((p) => p.gainDb));

  const yMin = Math.floor((lowestDb - 3) / 10) * 10;
  const yMax = Math.ceil((highestDb + 3) / 10) * 10;

  function xScale(frequency) {
    return (
      left +
      ((Math.log10(frequency) - minLog) / (maxLog - minLog)) * graphWidth
    );
  }

  function yScale(db) {
    return top + ((yMax - db) / (yMax - yMin)) * graphHeight;
  }

  svg.appendChild(
    el("rect", {
      x: left,
      y: top,
      width: graphWidth,
      height: graphHeight,
      fill: "#0c1117",
      stroke: "#2a3441",
      "stroke-width": 1
    })
  );

  for (let db = yMin; db <= yMax; db += 10) {
    const y = yScale(db);

    svg.appendChild(
      el("line", {
        x1: left,
        y1: y,
        x2: width - right,
        y2: y,
        stroke: "#26313d",
        "stroke-width": 1,
        "stroke-dasharray": "4 4"
      })
    );

    label(svg, left - 12, y + 4, `${db} dB`, {
      "text-anchor": "end",
      fill: "#8b98a5",
      "font-size": 11
    });
  }

  for (
    let power = Math.ceil(minLog);
    power <= Math.floor(maxLog);
    power++
  ) {
    const frequency = 10 ** power;
    const x = xScale(frequency);

    svg.appendChild(
      el("line", {
        x1: x,
        y1: top,
        x2: x,
        y2: height - bottom,
        stroke: "#26313d",
        "stroke-width": 1,
        "stroke-dasharray": "4 4"
      })
    );

    const frequencyText =
      frequency >= 1000 ? `${frequency / 1000}k` : `${frequency}`;

    label(svg, x, height - bottom + 22, frequencyText, {
      fill: "#8b98a5",
      "font-size": 11
    });
  }

  label(svg, 18, top + graphHeight / 2, "Kazanç (dB)", {
    fill: "#8b98a5",
    "font-size": 12,
    transform: `rotate(-90 18 ${top + graphHeight / 2})`
  });

  label(
    svg,
    left + graphWidth / 2,
    height - 18,
    "Frekans (Hz) — Logaritmik Ölçek",
    {
      fill: "#8b98a5",
      "font-size": 12
    }
  );

  let path = "";

  points.forEach((point, index) => {
    const x = xScale(point.f);
    const y = yScale(point.gainDb);

    path += index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  svg.appendChild(
    el("path", {
      d: path,
      fill: "none",
      stroke: "#5ec8f8",
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    })
  );

  const middleBandY = yScale(AvmidDb);

  svg.appendChild(
    el("line", {
      x1: left,
      y1: middleBandY,
      x2: width - right,
      y2: middleBandY,
      stroke: "#7ee787",
      "stroke-width": 1.5,
      "stroke-dasharray": "6 5",
      opacity: 0.8
    })
  );

  label(
    svg,
    width - right - 4,
    middleBandY - 7,
    `Orta-bant: ${fmt(AvmidDb, 2)} dB`,
    {
      "text-anchor": "end",
      fill: "#7ee787",
      "font-size": 11
    }
  );

  const fLX = xScale(fL);

  const wL = 2 * Math.PI * fL;
  const w1L = 2 * Math.PI * fc1;
  const w2L = 2 * Math.PI * fc2;

  const h1L = wL / Math.sqrt(wL * wL + w1L * w1L);
  const h2L = wL / Math.sqrt(wL * wL + w2L * w2L);

  const dbAtFL = 20 * Math.log10(Math.abs(Avmid * h1L * h2L));
  const fLY = yScale(dbAtFL);

  svg.appendChild(
    el("line", {
      x1: fLX,
      y1: top,
      x2: fLX,
      y2: height - bottom,
      stroke: "#ffb454",
      "stroke-width": 2,
      "stroke-dasharray": "7 5"
    })
  );

  svg.appendChild(
    el("circle", {
      cx: fLX,
      cy: fLY,
      r: 6,
      fill: "#0c1117",
      stroke: "#ffb454",
      "stroke-width": 3
    })
  );

  label(svg, fLX, top + 18, `fL = ${fmt(fL, 1)} Hz`, {
    fill: "#ffb454",
    "font-size": 12
  });

  label(svg, fLX + 10, fLY - 12, `${fmt(dbAtFL, 2)} dB`, {
    "text-anchor": "start",
    fill: "#ffb454",
    "font-size": 11
  });

  note.innerHTML = `
    Grafik, C1 ve C2 kuplaj kapasitörlerinin toplam alçak frekans etkisini gösterir.
    <strong>f<sub>L</sub> = ${fmt(fL, 1)} Hz</strong> noktasında kazanç
    <strong>${fmt(dbAtFL, 2)} dB</strong> değerindedir.
    Orta-bant kazancı ise yaklaşık <strong>${fmt(AvmidDb, 2)} dB</strong>'dir.
  `;
}

function el(tag, attrs = {}, text) {
  const node = document.createElementNS(
    "http://www.w3.org/2000/svg",
    tag
  );

  Object.entries(attrs).forEach(([key, value]) => {
    node.setAttribute(key, value);
  });

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
}

function clearSvg(svg) {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
}

function wire(svg, x1, y1, x2, y2) {
  svg.appendChild(
    el("line", {
      x1,
      y1,
      x2,
      y2,
      stroke: "#8b98a5",
      "stroke-width": 1.6
    })
  );
}

function label(svg, x, y, text, opts = {}) {
  svg.appendChild(
    el(
      "text",
      {
        x,
        y,
        fill: "#e6edf3",
        "font-size": 12,
        "text-anchor": "middle",
        ...opts
      },
      text
    )
  );
}

function gnd(svg, x, y) {
  [
    [-10, 0, 10, 0],
    [-6, 4, 6, 4],
    [-2, 8, 2, 8]
  ].forEach(([a, b, c, d]) => {
    svg.appendChild(
      el("line", {
        x1: x + a,
        y1: y + b,
        x2: x + c,
        y2: y + d,
        stroke: "#8b98a5",
        "stroke-width": 1.6
      })
    );
  });
}

function resistor(svg, x, y, w, h, text = "", vertical = false) {
  svg.appendChild(
    el("rect", {
      x,
      y,
      width: vertical ? h : w,
      height: vertical ? w : h,
      fill: "none",
      stroke: "#5ec8f8",
      "stroke-width": 1.6,
      rx: 2
    })
  );

  if (text) {
    label(svg, x + (vertical ? h : w) / 2, y - 8, text, {
      fill: "#5ec8f8",
      "font-size": 10
    });
  }
}

function cap(svg, x, y, vertical = true, text = "") {
  if (vertical) {
    svg.appendChild(
      el("line", {
        x1: x - 10,
        y1: y,
        x2: x + 10,
        y2: y,
        stroke: "#7ee787",
        "stroke-width": 2
      })
    );

    svg.appendChild(
      el("line", {
        x1: x - 10,
        y1: y + 8,
        x2: x + 10,
        y2: y + 8,
        stroke: "#7ee787",
        "stroke-width": 2
      })
    );

    if (text) {
      label(svg, x + 26, y + 4, text, {
        fill: "#7ee787",
        "font-size": 10
      });
    }
  } else {
    svg.appendChild(
      el("line", {
        x1: x,
        y1: y - 10,
        x2: x,
        y2: y + 10,
        stroke: "#7ee787",
        "stroke-width": 2
      })
    );

    svg.appendChild(
      el("line", {
        x1: x + 8,
        y1: y - 10,
        x2: x + 8,
        y2: y + 10,
        stroke: "#7ee787",
        "stroke-width": 2
      })
    );

    if (text) {
      label(svg, x + 4, y - 16, text, {
        fill: "#7ee787",
        "font-size": 10
      });
    }
  }
}

function transistor(svg, x, y) {
  svg.appendChild(
    el("circle", {
      cx: x,
      cy: y,
      r: 28,
      fill: "none",
      stroke: "#ffb454",
      "stroke-width": 1.6
    })
  );

  svg.appendChild(
    el("line", {
      x1: x - 8,
      y1: y - 16,
      x2: x - 8,
      y2: y + 16,
      stroke: "#ffb454",
      "stroke-width": 2
    })
  );

  svg.appendChild(
    el("line", {
      x1: x - 8,
      y1: y - 10,
      x2: x + 14,
      y2: y - 22,
      stroke: "#ffb454",
      "stroke-width": 2
    })
  );

  svg.appendChild(
    el("line", {
      x1: x - 8,
      y1: y + 10,
      x2: x + 14,
      y2: y + 22,
      stroke: "#ffb454",
      "stroke-width": 2
    })
  );

  svg.appendChild(
    el("polygon", {
      points: `${x + 14},${y + 22} ${x + 4},${y + 16} ${x + 10},${y + 10}`,
      fill: "#ffb454"
    })
  );

  svg.appendChild(
    el("line", {
      x1: x - 22,
      y1: y,
      x2: x - 8,
      y2: y,
      stroke: "#ffb454",
      "stroke-width": 2
    })
  );

  label(svg, x - 2, y - 32, "Q1", {
    fill: "#ffb454"
  });
}

function drawMain() {
  const svg = document.getElementById("svgMain");
  clearSvg(svg);

  const { VCC, VEE, RE, RC, RL, Rs, C1, C2 } = state;

  const top = 40;
  const bottom = 320;
  const tcy = 158;

  wire(svg, 150, top, 460, top);

  label(svg, 470, 44, `+VCC = ${VCC.toFixed(1)} V`, {
    "text-anchor": "start",
    fill: "#ffb454",
    "font-size": 11
  });

  wire(svg, 400, top, 400, 90);
  resistor(svg, 388, 90, 24, 40, `RC=${RC.toFixed(2)}kΩ`, true);

  wire(svg, 400, 130, 400, tcy - 28);
  transistor(svg, 400, tcy);

  wire(svg, 414, tcy - 22, 460, tcy - 22);
  wire(svg, 400, tcy - 28, 400, 130);

  wire(svg, 400, 110, 470, 110);
  cap(svg, 490, 110, true, "");

  label(svg, 490, 136, `C2=${C2.toFixed(1)}µF`, {
    fill: "#7ee787",
    "font-size": 10
  });

  wire(svg, 512, 110, 545, 110);
  resistor(svg, 533, 98, 24, 24, "", true);

  label(svg, 545, 78, `RL=${RL.toFixed(1)}kΩ`, {
    fill: "#5ec8f8",
    "font-size": 10
  });

  label(svg, 515, 94, "Vo", {
    fill: "#e6edf3",
    "font-size": 11
  });

  wire(svg, 545, 122, 545, 160);
  gnd(svg, 545, 168);

  wire(svg, 378, tcy, 330, tcy);
  gnd(svg, 330, tcy);

  label(svg, 360, tcy - 8, "Baz (toprak)", {
    "font-size": 10
  });

  wire(svg, 408, tcy + 22, 408, tcy + 60);
  resistor(svg, 396, tcy + 60, 24, 40, `RE=${RE.toFixed(2)}kΩ`, true);

  wire(svg, 408, tcy + 100, 408, bottom);
  wire(svg, 408, bottom, 460, bottom);

  label(svg, 470, bottom + 4, `-VEE = -${VEE.toFixed(1)} V`, {
    "text-anchor": "start",
    fill: "#ffb454",
    "font-size": 11
  });

  wire(svg, 150, tcy, 170, tcy);
  cap(svg, 190, tcy, true, "");

  label(svg, 190, tcy + 28, `C1=${C1.toFixed(1)}µF`, {
    fill: "#7ee787",
    "font-size": 10
  });

  wire(svg, 212, tcy, 408, tcy);

  svg.appendChild(
    el("circle", {
      cx: 110,
      cy: tcy,
      r: 22,
      fill: "none",
      stroke: "#5ec8f8",
      "stroke-width": 1.6
    })
  );

  label(svg, 110, tcy + 4, "Vs", {
    fill: "#5ec8f8"
  });

  wire(svg, 110, tcy - 22, 110, tcy - 40);
  wire(svg, 110, tcy - 40, 150, tcy - 40);
  wire(svg, 150, tcy - 40, 150, tcy);

  wire(svg, 110, tcy + 22, 110, tcy + 40);
  gnd(svg, 110, tcy + 46);

  resistor(svg, 98, tcy - 52, 24, 24, "", true);

  label(svg, 150, tcy - 56, `Rs=${Rs.toFixed(0)}Ω`, {
    fill: "#5ec8f8",
    "font-size": 10
  });
}

function drawDC(VCC, VEE, RE, RC, IE, IC, IB, VCE, VCB, VBE, VC, VE) {
  const svg = document.getElementById("svgDC");
  clearSvg(svg);

  const tcy = 160;

  wire(svg, 150, 40, 460, 40);

  label(svg, 470, 44, `+VCC = ${VCC.toFixed(1)} V`, {
    "text-anchor": "start",
    fill: "#ffb454",
    "font-size": 11
  });

  wire(svg, 400, 40, 400, 90);
  resistor(svg, 388, 90, 24, 40, `RC=${RC.toFixed(2)}kΩ`, true);

  wire(svg, 400, 130, 400, tcy - 28);
  transistor(svg, 400, tcy);

  wire(svg, 378, tcy, 300, tcy);
  gnd(svg, 300, tcy);

  wire(svg, 408, tcy + 22, 408, tcy + 60);
  resistor(svg, 396, tcy + 60, 24, 40, `RE=${RE.toFixed(2)}kΩ`, true);

  wire(svg, 408, tcy + 100, 408, 300);
  wire(svg, 408, 300, 460, 300);

  label(svg, 470, 304, `-VEE = -${VEE.toFixed(1)} V`, {
    "text-anchor": "start",
    fill: "#ffb454",
    "font-size": 11
  });

  label(svg, 36, 118, `I_B = ${fmt(IB * 1e6)} µA`, {
    "text-anchor": "start",
    fill: "#7ee787",
    "font-size": 11
  });

  label(svg, 36, 144, `V_CE = ${fmt(VCE)} V`, {
    "text-anchor": "start",
    fill: "#ffb454",
    "font-size": 11
  });

  label(svg, 36, 170, `V_CB = ${fmt(VCB)} V`, {
    "text-anchor": "start",
    fill: "#ffb454",
    "font-size": 11
  });

  label(svg, 36, 196, `V_BE = ${fmt(VBE)} V`, {
    "text-anchor": "start",
    fill: "#ffb454",
    "font-size": 11
  });

  label(svg, 472, 135, `I_C = ${fmt(IC * 1e3)} mA`, {
    "text-anchor": "start",
    fill: "#7ee787",
    "font-size": 11
  });

  label(svg, 472, 226, `I_E = ${fmt(IE * 1e3)} mA`, {
    "text-anchor": "start",
    fill: "#7ee787",
    "font-size": 11
  });

  label(svg, 182, 92, `V_C = ${fmt(VC)} V`, {
    "text-anchor": "start",
    fill: "#5ec8f8",
    "font-size": 11
  });

  label(svg, 182, 258, `V_E = ${fmt(VE)} V`, {
    "text-anchor": "start",
    fill: "#5ec8f8",
    "font-size": 11
  });
}

function drawAC(Rs, RinE, RCL, Avmid, fc1, fc2, fL, KvfLdB, isActive) {
  const svg = document.getElementById("svgAC");
  clearSvg(svg);

  const y = 150;

  svg.appendChild(
    el("circle", {
      cx: 70,
      cy: y,
      r: 22,
      fill: "none",
      stroke: "#5ec8f8",
      "stroke-width": 1.6
    })
  );

  label(svg, 70, y + 4, "Vs", {
    fill: "#5ec8f8"
  });

  wire(svg, 70, y - 22, 70, y - 40);
  wire(svg, 70, y - 40, 110, y - 40);
  wire(svg, 110, y - 40, 110, y - 20);

  resistor(svg, 98, y - 40, 24, 20, isActive ? `Rs=${Rs}Ω` : "Rs", true);

  wire(svg, 110, y - 20, 110, y);
  wire(svg, 92, y, 110, y);

  wire(svg, 70, y + 22, 70, y + 60);
  gnd(svg, 70, y + 66);

  wire(svg, 110, y, 140, y);
  cap(svg, 150, y, true, "C1");

  wire(svg, 172, y, 210, y);

  resistor(svg, 210, y - 12, 50, 24, "", false);

  label(svg, 235, y - 18, "R_in = R_E||r_e", {
    fill: "#5ec8f8",
    "font-size": 10
  });

  label(svg, 235, y + 28, isActive ? `= ${fmt(RinE)} Ω` : "= —", {
    fill: "#5ec8f8",
    "font-size": 11
  });

  wire(svg, 260, y, 300, y);

  wire(svg, 210, y, 210, y + 40);
  gnd(svg, 210, y + 46);

  svg.appendChild(
    el("rect", {
      x: 300,
      y: y - 25,
      width: 90,
      height: 50,
      fill: "none",
      stroke: "#ffb454",
      "stroke-width": 1.6,
      rx: 6
    })
  );

  label(svg, 345, y - 4, "A_v·V_in", {
    fill: "#ffb454",
    "font-size": 12
  });

  label(svg, 345, y + 14, "(orta-bant)", {
    fill: "#ffb454",
    "font-size": 9
  });

  label(svg, 345, y - 34, isActive ? `A_v = ${fmt(Avmid)}` : "A_v = —", {
    fill: "#ffb454",
    "font-size": 11
  });

  wire(svg, 390, y, 420, y);

  resistor(svg, 420, y - 12, 60, 24, "", false);

  label(svg, 450, y - 18, "R_C || R_L", {
    fill: "#5ec8f8",
    "font-size": 10
  });

  label(svg, 450, y + 28, isActive ? `= ${fmt(RCL)} Ω` : "= —", {
    fill: "#5ec8f8",
    "font-size": 11
  });

  wire(svg, 480, y, 500, y);
  cap(svg, 505, y, true, "C2");

  wire(svg, 300, y + 25, 300, y + 50);
  gnd(svg, 300, y + 56);

  wire(svg, 420, y, 420, y + 50);
  gnd(svg, 420, y + 56);

  label(svg, 490, y - 40, "Vo", {
    fill: "#e6edf3",
    "font-size": 12
  });

  if (!isActive) {
    label(
      svg,
      280,
      262,
      "AC küçük-sinyal analizi yalnızca aktif bölgede geçerlidir.",
      {
        fill: "#ffb454",
        "font-size": 13
      }
    );

    label(
      svg,
      280,
      288,
      "Aktif bölgeye geçmek için VEE, RE veya RC değerlerini değiştir.",
      {
        fill: "#8b98a5",
        "font-size": 11
      }
    );

    return;
  }

  label(
    svg,
    280,
    250,
    `f_c1 = ${fmt(fc1, 1)} Hz   (C1 ile R_s+R_in oluşturur)`,
    {
      fill: "#7ee787",
      "font-size": 12
    }
  );

  label(
    svg,
    280,
    274,
    `f_c2 = ${fmt(fc2, 1)} Hz   (C2 ile R_C+R_L oluşturur)`,
    {
      fill: "#7ee787",
      "font-size": 12
    }
  );

  label(
    svg,
    280,
    298,
    `f_L = max(f_c1,f_c2) = ${fmt(fL, 1)} Hz`,
    {
      fill: "#ffb454",
      "font-size": 13
    }
  );

  label(svg, 280, 322, `|K_v(f_L)| = ${fmt(KvfLdB, 2)} dB`, {
    fill: "#5ec8f8",
    "font-size": 14
  });
}

params.forEach((p) => {
  const wrap = document.createElement("div");
  wrap.className = "sl";

  wrap.innerHTML = `
    <label for="in_${p.key}">
      <span>${p.label} (${p.unit || "—"})</span>

      <input
        class="value-input"
        id="num_${p.key}"
        type="number"
        min="${p.min}"
        max="${p.max}"
        step="${p.step}"
        value="${inputFormat(p, p.val)}"
      >
    </label>

    <div class="slider-row">
      <input
        type="range"
        id="in_${p.key}"
        min="${p.min}"
        max="${p.max}"
        step="${p.step}"
        value="${p.val}"
      >

      <span class="unit">${p.unit}</span>
    </div>
  `;

  slidersDiv.appendChild(wrap);

  const range = wrap.querySelector(`#in_${p.key}`);
  const number = wrap.querySelector(`#num_${p.key}`);

  range.addEventListener("input", (e) => {
    state[p.key] = Number(e.target.value);

    number.value = inputFormat(p, state[p.key]);

    clearSelectedScenario();
    compute();
  });

  number.addEventListener("change", (e) => {
    const raw = Number(e.target.value);

    const safe = Number.isFinite(raw)
      ? clamp(raw, p.min, p.max)
      : state[p.key];

    state[p.key] = safe;

    range.value = safe;
    number.value = inputFormat(p, safe);

    clearSelectedScenario();
    compute();
  });
});

document.querySelectorAll(".scenario-card").forEach((card) => {
  card.addEventListener("click", () => {
    applyScenario(card.dataset.scenario);
  });
});

saveExperimentBtn.addEventListener("click", saveExperiment);

clearExperimentsBtn.addEventListener("click", () => {
  experiments.length = 0;
  renderExperiments();
});

experimentTableBody.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-record-btn");

  if (!button) return;

  const index = Number(button.dataset.deleteIndex);

  if (Number.isInteger(index)) {
    experiments.splice(index, 1);
    renderExperiments();
  }
});

renderExperiments();
compute();