let state = {
    mission: null,
    missionDesc: '',
    maxBudget: 0,
    budget: 0,
    mass: 0,
    maxMass: 0,
    power: 0,
    reqPower: 0,
    rocket: null,
    shieldLevel: 'متوسط (Standard)',
    instruments: { cam: false, lab: false, solar: false, shield: false }
};

function selectMission(name, budget, maxMass, reqPower, desc) {
    state.mission = name;
    state.missionDesc = desc;
    state.maxBudget = budget;
    state.budget = budget;
    state.maxMass = maxMass;
    state.reqPower = reqPower;

    document.getElementById('max-mass-text').innerText = maxMass;
    document.getElementById('req-power-text').innerText = reqPower;
    document.getElementById('mission-badge-display').innerText = `الوجهة: ${name}`;

    document.getElementById('step-1').classList.remove('active');
    document.getElementById('step-2').classList.add('active');
    updateUI();
}

function selectRocket(type, cost, mass) {
    if (state.rocket) {
        if (state.rocket === 'Heavy') { state.budget += 60; state.mass -= 40; }
        else { state.budget += 30; state.mass -= 22; }
        document.getElementById('rocket-Heavy').classList.remove('selected');
        document.getElementById('rocket-Light').classList.remove('selected');
    }
    state.rocket = type;
    state.budget -= cost;
    state.mass += mass;
    document.getElementById('rocket-' + type).classList.add('selected');
    updateUI();
    updateAI();
}

function toggleInst(id, cost, mass, powerVal) {
    let el = document.getElementById('inst-' + id);
    if (!state.instruments[id]) {
        state.budget -= cost;
        state.mass += mass;
        if(id === 'shield') {
            state.shieldLevel = 'مرتفع جداً (Advanced Heavy Shielding)';
        } else {
            state.power += powerVal;
        }
        state.instruments[id] = true;
        el.classList.add('selected');
    } else {
        state.budget += cost;
        state.mass -= mass;
        if(id === 'shield') {
            state.shieldLevel = 'متوسط (Standard)';
        } else {
            state.power -= powerVal;
        }
        state.instruments[id] = false;
        el.classList.remove('selected');
    }
    document.getElementById('shield-text').innerText = state.shieldLevel;
    updateUI();
    updateAI();
}

function updateUI() {
    document.getElementById('budget-text').innerText = state.budget + ' M$';
    document.getElementById('mass-text').innerText = state.mass;
    document.getElementById('power-text').innerText = state.power;

    let bPer = Math.max(0, (state.budget / state.maxBudget) * 100);
    let mPer = Math.min(100, (state.mass / state.maxMass) * 100);
    let pPer = Math.min(100, Math.max(0, (state.power / state.reqPower) * 100));

    let bBar = document.getElementById('bar-budget');
    bBar.style.width = bPer + '%';
    bBar.style.background = bPer < 15 ? 'var(--danger)' : 'var(--success)';

    let mBar = document.getElementById('bar-mass');
    mBar.style.width = mPer + '%';
    mBar.style.background = mPer > 90 ? 'var(--danger)' : 'var(--warning)';

    let pBar = document.getElementById('bar-power');
    pBar.style.width = pPer + '%';
    pBar.style.background = pPer >= 100 ? 'var(--success)' : 'var(--warning)';
}

function updateAI() {
    let msg = "";
    if (!state.rocket) msg = "الرجاء اختيار نوع الصاروخ المناسب لحمولة المهمة أولاً.";
    else if (state.budget < 10) msg = "تنبيه خطير: الميزانية شارفت على النفاد تماماً!";
    else if (state.mass > state.maxMass) msg = "خطر: الكتلة الكلية تجاوزت القدرة القصوى لصاروخ الإطلاق!";
    else if (state.power < state.reqPower) msg = "طاقة ناقصة: يرجى إضافة ألواح شمسية لتغطية عجز الطاقة.";
    else msg = "جميع المؤشرات مستقرة، النظام هندسياً متوازن وجاهز للإطلاق!";
    document.getElementById('ai-msg').innerText = msg;
}

function triggerLaunchSequence() {
    if (!state.rocket) {
        alert("يجب اختيار صاروخ الإطلاق أولاً!");
        return;
    }

    document.getElementById('step-2').classList.remove('active');
    document.getElementById('step-launch-anim').classList.add('active');

    // محاكاة حية للتيليماتري والعدادات أثناء الطيران
    let alt = 0;
    let spd = 0;
    let timer = setInterval(() => {
        alt += 35;
        spd += 1200;
        document.getElementById('tele-alt').innerText = alt;
        document.getElementById('tele-spd').innerText = spd;
        if(alt > 200) document.getElementById('tele-grav').innerText = '0.0G (Orbit)';
    }, 350);

    // تشغيل انيميشن الصاروخ
    setTimeout(() => {
        document.getElementById('animated-rocket').classList.add('launching');
    }, 200);

    // الانتقال لتقرير النتائج بعد انتهاء الانيميشن
    setTimeout(() => {
        clearInterval(timer);
        document.getElementById('step-launch-anim').classList.remove('active');
        document.getElementById('step-3').classList.add('active');
        evaluateMission();
    }, 3200);
}

function evaluateMission() {
    let box = document.getElementById('result-box');
    let eventBox = document.getElementById('event-box');
    
    let success = true;
    let reasons = [];
    let tradeOffLog = "";

    if (!state.rocket) { success = false; reasons.push("لم يتم اختيار نظام دفع للصاروخ."); }
    if (state.budget < 0) { success = false; reasons.push("تجاوز الميزانية الكلية المرصودة للمهمة."); }
    if (state.mass > state.maxMass) { success = false; reasons.push("فشل هيكلي: الكتلة الكلية تفوق طاقة دفع الصاروخ خارج الجاذبية."); }
    if (state.power < state.reqPower) { success = false; reasons.push("قصور طاقي: فشل الأجهزة بسبب عجز إمدادات الطاقة الكهربائية."); }

    // محاكاة حدث طارئ عشوائي بناءً على درع الحماية
    let solarStormHit = Math.random() > 0.4;
    let stormMsg = "";

    if (solarStormHit) {
        if (!state.instruments.shield) {
            success = false;
            reasons.push("تدمير إشعاعي: ضربت عاصفة شمسية المركبة وغياب الدرع الإشعاعي أدى لعطل تام في المعالجات.");
            stormMsg = "⚠️ <b>حدث طارئ:</b> تعرضت المركبة لعاصفة شمسية عاتية ولم تكن مزودة بدرع حماية كافٍ!";
        } else {
            stormMsg = "🛡️ <b>حدث طارئ:</b> نجحت المركبة في اجتياز عاصفة شمسية مدمرة بفضل كفاءة الدرع الإشعاعي المضاف.";
        }
    } else {
        stormMsg = "✨ سارت ظروف الفضاء وسجلت الحالة الجوية هدوءاً نسبياً طوال الرحلة.";
    }

    if (success) {
        box.className = "result-card success";
        box.innerHTML = `
            <h3 style="color: var(--success);"><i class="fa-solid fa-circle-check"></i> نجحت المهمة الفضائية بنجاح باهر!</h3>
            <p>وصلت المركبة إلى مدارها بنجاح تام وبدأت في إرسال البيانات العلمية والاتصالات الأرضية.</p>
        `;
        tradeOffLog = `
            <strong>تحليل دراسة المقايضات الهندسية (Trade-offs Analysis):</strong><br>
            - حافظت على ميزانية متوازنة المتبقي فيها ($${state.budget}M).<br>
            - استغلال الكتلة بذكاء (الكتلة الحالية: ${state.mass} طن من أصل ${state.maxMass} طن).<br>
            - تلبية متطلبات الطاقة للمهمة بدقة (${state.power} kW متولدة مقابل ${state.reqPower} kW مطلوبة).<br>
            <br>${stormMsg}
        `;
    } else {
        box.className = "result-card danger";
        box.innerHTML = `
            <h3 style="color: var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> فشلت المهمة في تحقيق أهدافها!</h3>
            <p><strong>الأسباب الجذرية للفشل الهندي / الفضائي:</strong></p>
            <ul style="text-align: right; display: inline-block; margin-top: 10px;">
                ${reasons.map(r => `<li>${r}</li>`).join('')}
            </ul>
        `;
        tradeOffLog = `
            <strong>تقرير تحليل أسباب الإخفاق:</strong><br>
            ظهرت اختلالات واضحة في معادلة الموازنة بين الكتلة، الميزانية، وتوليد الطاقة.<br>
            <br>${stormMsg}
        `;
    }

    eventBox.innerHTML = tradeOffLog;
}

fetch("").then()