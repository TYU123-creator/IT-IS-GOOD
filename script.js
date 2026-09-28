/* =====================================================
   كن منظما
   نظام محلي بالكامل باستخدام localStorage
===================================================== */

const CURRENT_KEY = "kon_monzaman_current";
const ACCOUNT_PREFIX = "kon_monzaman_account_";

let data = null;
let currentCode = null;

let reminderTimer = null;


/* =====================================================
   أدوات عامة
===================================================== */

function todayKey() {

    const d = new Date();

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function accountKey(code) {

    return ACCOUNT_PREFIX + encodeURIComponent(code);
}


function saveData() {

    if (!data || !currentCode) return;

    localStorage.setItem(
        accountKey(currentCode),
        JSON.stringify(data)
    );

    updateCurrentUser();
}


function updateCurrentUser() {

    if (!data) return;

    localStorage.setItem(
        CURRENT_KEY,
        currentCode
    );

    const top = document.getElementById("topUsername");

    if (top) {
        top.textContent = "👤 " + data.username;
    }
}


/* =====================================================
   البيانات الافتراضية
===================================================== */

function createTask(text = "") {

    return {
        text,
        time: "",
        important: false,
        status: "none"
    };
}


function createBox(name, fixed = false) {

    return {
        name,
        fixed,
        tasks: [
            createTask(""),
            createTask(""),
            createTask("")
        ]
    };
}


function createDefaultData(username) {

    return {

        version: 7,

        username,

        lastDate: todayKey(),

        streak: 0,

        points: 0,

        achievements: [],

        settings: {

            dark: false,

            accent: "#1976d2",

            notifications: false,

            reminderTime: "18:00",

            lastReminder: ""

        },


        student: {

            boxes: [

                createBox("المذاكرة"),

                createBox("الواجبات"),

                createBox("المراجعة"),

                createBox("مهام أخرى"),

                createBox("📌 مهام ثابتة", true)

            ]

        },


        employee: {

            boxes: [

                createBox("مهام العمل"),

                createBox("المشاريع"),

                createBox("الاجتماعات"),

                createBox("مهام أخرى"),

                createBox("📌 مهام ثابتة", true)

            ]

        },


        tables: {

            normal: [],

            task: [],

            weekly: {

                days: [
                    "السبت",
                    "الأحد",
                    "الإثنين",
                    "الثلاثاء",
                    "الأربعاء",
                    "الخميس",
                    "الجمعة"
                ],

                cells: []

            }

        },


        notes: {

            title: "",

            body: ""

        },


        archive: []

    };

}


/* =====================================================
   ترحيل البيانات القديمة
===================================================== */

function migrateData(obj) {

    if (!obj || typeof obj !== "object") {
        return createDefaultData("مستخدم");
    }


    if (!obj.settings) {

        obj.settings = {

            dark: false,

            accent: "#1976d2",

            notifications: false,

            reminderTime: "18:00",

            lastReminder: ""

        };

    }


    if (!obj.settings.accent) {
        obj.settings.accent = "#1976d2";
    }

    if (!obj.settings.reminderTime) {
        obj.settings.reminderTime = "18:00";
    }


    if (!obj.student) {
        obj.student = {};
    }

    if (!obj.employee) {
        obj.employee = {};
    }


    normalizePerson(obj.student, "student");

    normalizePerson(obj.employee, "employee");


    if (!obj.tables) {
        obj.tables = {};
    }

    if (!Array.isArray(obj.tables.normal)) {
        obj.tables.normal = [];
    }

    if (!Array.isArray(obj.tables.task)) {
        obj.tables.task = [];
    }


    if (!obj.tables.weekly) {

        obj.tables.weekly = {

            days: [
                "السبت",
                "الأحد",
                "الإثنين",
                "الثلاثاء",
                "الأربعاء",
                "الخميس",
                "الجمعة"
            ],

            cells: []

        };

    }


    if (!obj.notes) {

        obj.notes = {

            title: "",

            body: ""

        };

    }


    if (!Array.isArray(obj.archive)) {
        obj.archive = [];
    }


    if (!Array.isArray(obj.achievements)) {
        obj.achievements = [];
    }


    if (typeof obj.points !== "number") {
        obj.points = 0;
    }


    if (typeof obj.streak !== "number") {
        obj.streak = 0;
    }


    if (!obj.lastDate) {
        obj.lastDate = todayKey();
    }


    obj.version = 7;

    return obj;
}


function normalizePerson(person, type) {

    if (!Array.isArray(person.boxes)) {
        person.boxes = [];
    }


    /*
      الميزة المهمة:
      نضمن وجود 5 مربعات دائماً.
      المربع الخامس ثابت.
    */

    const defaults =
        type === "student"
            ? [
                "المذاكرة",
                "الواجبات",
                "المراجعة",
                "مهام أخرى",
                "📌 مهام ثابتة"
            ]
            : [
                "مهام العمل",
                "المشاريع",
                "الاجتماعات",
                "مهام أخرى",
                "📌 مهام ثابتة"
            ];


    while (person.boxes.length < 5) {

        const index = person.boxes.length;

        person.boxes.push(
            createBox(
                defaults[index],
                index === 4
            )
        );

    }


    /*
      لو كانت هناك مربعات أكثر من خمسة
      لا نحذفها حتى لا نخسر بيانات المستخدم.
    */


    person.boxes.forEach((box, index) => {

        if (!box.name) {
            box.name = defaults[index] || `المربع ${index + 1}`;
        }

        if (index === 4) {
            box.fixed = true;
        }

        if (!Array.isArray(box.tasks)) {
            box.tasks = [];
        }


        box.tasks.forEach(task => {

            if (typeof task.text !== "string") {
                task.text = "";
            }

            if (typeof task.time !== "string") {
                task.time = "";
            }

            if (typeof task.important !== "boolean") {
                task.important = false;
            }

            if (!task.status) {

                task.status =
                    task.done === true
                        ? "done"
                        : "none";

            }

        });

    });

}


/* =====================================================
   بداية اليوم الجديد
===================================================== */

function checkNewDay() {

    if (!data) return;

    const current = todayKey();

    if (data.lastDate === current) {
        return;
    }


    /*
      نحفظ المهام القديمة في الأرشيف.
    */

    ["student", "employee"].forEach(type => {

        const person = data[type];

        person.boxes.forEach((box, index) => {

            if (index < 4) {

                const nonEmpty = box.tasks.filter(
                    task => task.text.trim() !== ""
                );

                if (nonEmpty.length > 0) {

                    data.archive.push({

                        date: data.lastDate,

                        type,

                        boxName: box.name,

                        tasks: JSON.parse(
                            JSON.stringify(nonEmpty)
                        )

                    });

                }


                /*
                  أول أربعة مربعات تتجدد.
                  الاسم يبقى كما هو.
                */

                box.tasks = [
                    createTask(""),
                    createTask(""),
                    createTask("")
                ];

            }

            else {

                /*
                  المربع الخامس ثابت.
                  المهام لا تحذف.
                  الحالة فقط تعود إلى لم يتم.
                */

                box.tasks.forEach(task => {

                    task.status = "none";

                });

            }

        });

    });


    /*
      إعادة حالات جدول المهام.
    */

    data.tables.task.forEach(table => {

        table.cells.forEach(row => {

            row.forEach(cell => {

                if (typeof cell === "object") {
                    cell.done = false;
                    cell.count = 0;
                }

            });

        });

    });


    data.lastDate = current;

    data.streak = Math.max(
        0,
        Number(data.streak || 0)
    );


    saveData();

}


/* =====================================================
   تسجيل الدخول
===================================================== */

function showRegister() {

    document.getElementById("loginBox")
        .classList.add("hidden");

    document.getElementById("registerBox")
        .classList.remove("hidden");

}


function showLogin() {

    document.getElementById("registerBox")
        .classList.add("hidden");

    document.getElementById("loginBox")
        .classList.remove("hidden");

}


function register() {

    const username =
        document.getElementById("registerUsername")
            .value.trim();

    const code =
        document.getElementById("registerCode")
            .value;

    const confirm =
        document.getElementById("registerCodeConfirm")
            .value;


    if (!username) {

        alert("اكتبي اسم المستخدم.");

        return;

    }


    if (!code) {

        alert("اختاري رمز الدخول.");

        return;

    }


    if (code.length < 3) {

        alert("رمز الدخول يجب أن يكون 3 أحرف أو أرقام على الأقل.");

        return;

    }


    if (code !== confirm) {

        alert("رمزا الدخول غير متطابقين.");

        return;

    }


    if (localStorage.getItem(accountKey(code))) {

        alert("هذا الرمز مستخدم بالفعل، اختاري رمزاً آخر.");

        return;

    }


    data = createDefaultData(username);

    currentCode = code;

    saveData();

    openApp();

}


function login() {

    const code =
        document.getElementById("loginCode")
            .value;


    if (!code) {

        alert("أدخلي رمز الدخول.");

        return;

    }


    const raw =
        localStorage.getItem(accountKey(code));


    if (!raw) {

        alert("رمز الدخول غير صحيح أو الحساب غير موجود.");

        return;

    }


    try {

        data = migrateData(
            JSON.parse(raw)
        );

        currentCode = code;

        saveData();

        openApp();

    }

    catch (error) {

        console.error(error);

        alert("حدث خطأ في قراءة بيانات الحساب.");

    }

}


/* =====================================================
   فتح البرنامج
===================================================== */

function openApp() {

    checkNewDay();

    applySettings();

    document.getElementById("authScreen")
        .classList.add("hidden");

    document.getElementById("app")
        .classList.remove("hidden");


    updateCurrentUser();

    renderAll();

    scheduleNotifications();

    showPage("home");

}


/* =====================================================
   الصفحات
===================================================== */

function showPage(page) {

    document.querySelectorAll(".page")
        .forEach(el => el.classList.add("hidden"));


    const target =
        document.getElementById(page + "Page");


    if (target) {
        target.classList.remove("hidden");
    }


    if (page === "home") {

        renderHome();

    }

    if (page === "student") {

        renderPerson("student");

    }

    if (page === "employee") {

        renderPerson("employee");

    }

    if (page === "dashboard") {

        renderDashboard();

    }

    if (page === "tables") {

        renderTables();

    }

    if (page === "notes") {

        renderNotes();

    }

    if (page === "settings") {

        renderSettings();

    }

}


function renderAll() {

    renderHome();

    renderPerson("student");

    renderPerson("employee");

    renderDashboard();

    renderTables();

    renderNotes();

    renderSettings();

}


/* =====================================================
   الصفحة الرئيسية
===================================================== */

function getPersonStats(type) {

    let total = 0;

    let done = 0;

    let stars = 0;

    let starsDone = 0;


    data[type].boxes.forEach(box => {

        box.tasks.forEach(task => {

            if (task.text.trim() === "") return;


            total++;


            if (task.status === "done") {
                done++;
            }


            if (task.important) {

                stars++;

                if (task.status === "done") {
                    starsDone++;
                }

            }

        });

    });


    return {
        total,
        done,
        stars,
        starsDone
    };

}


function getCombinedStats() {

    const s = getPersonStats("student");

    const e = getPersonStats("employee");


    return {

        total: s.total + e.total,

        done: s.done + e.done,

        stars: s.stars + e.stars,

        starsDone: s.starsDone + e.starsDone

    };

}


function renderHome() {

    if (!data) return;


    const stats = getCombinedStats();


    const percent =
        stats.total > 0
            ? Math.round(
                stats.done / stats.total * 100
            )
            : 0;


    const starPercent =
        stats.stars > 0
            ? Math.round(
                stats.starsDone / stats.stars * 100
            )
            : 0;


    const fill =
        document.getElementById("homeOverallFill");

    const text =
        document.getElementById("homeOverallText");


    if (fill) {
        fill.style.width = percent + "%";
    }

    if (text) {
        text.textContent = percent + "%";
    }


    const starFill =
        document.getElementById("homeStarFill");

    const starText =
        document.getElementById("homeStarText");


    if (starFill) {
        starFill.style.width = starPercent + "%";
    }

    if (starText) {
        starText.textContent = starPercent + "%";
    }

}


/* =====================================================
   الطالب / الموظف
===================================================== */

function renderPerson(type) {

    const container =
        document.getElementById(
            type === "student"
                ? "studentContent"
                : "employeeContent"
        );


    if (!container || !data) return;


    const stats = getPersonStats(type);


    const percent =
        stats.total > 0
            ? Math.round(
                stats.done / stats.total * 100
            )
            : 0;


    const starPercent =
        stats.stars > 0
            ? Math.round(
                stats.starsDone / stats.stars * 100
            )
            : 0;


    const boxes =
        data[type].boxes;


    let html = `

        <div class="person-progress-area">

            <div class="progress-stats">

                <div class="progress-stat">
                    📋 المهام
                    <strong>${stats.done} / ${stats.total}</strong>
                </div>

                <div class="progress-stat">
                    ⭐ المميزة
                    <strong>${stats.starsDone} / ${stats.stars}</strong>
                </div>

                <div class="progress-stat">
                    📊 الإنجاز
                    <strong>${percent}%</strong>
                </div>

                <div class="progress-stat">
                    🔥 الأيام المتتالية
                    <strong>${data.streak}</strong>
                </div>

            </div>


            <div>
                <span>📈 الإنجاز اليومي</span>

                <div class="progress-track">

                    <div
                        class="progress-fill moving-gradient"
                        style="width:${percent}%"
                    ></div>

                </div>

            </div>


            <div>
                <span>⭐ إنجاز المهام المميزة</span>

                <div class="progress-track">

                    <div
                        class="progress-fill moving-gradient"
                        style="width:${starPercent}%"
                    ></div>

                </div>

            </div>

        </div>


        <div class="old-boxes-grid">
    `;


    boxes.forEach((box, index) => {

        html += renderOldTaskBox(
            type,
            box,
            index
        );

    });


    html += `</div>`;


    html += `

        <div class="person-bottom-stats">

            <div class="info-card">
                <h3>🎯 الهدف اليومي</h3>
                <div class="big-number">
                    ${stats.total}
                </div>
            </div>

            <div class="info-card">
                <h3>🔥 السلسلة</h3>
                <div class="big-number">
                    ${data.streak}
                </div>
            </div>

            <div class="info-card">
                <h3>🏆 النقاط</h3>
                <div class="big-number">
                    ${data.points}
                </div>
            </div>

            <div class="info-card">
                <h3>⭐ المميزة</h3>
                <div class="big-number">
                    ${stats.stars}
                </div>
            </div>

        </div>

    `;


    container.innerHTML = html;

}


/* =====================================================
   المربع القديم
===================================================== */

function renderOldTaskBox(type, box, index) {

    let html = `

        <div class="old-task-box ${box.fixed ? "fixed-box" : ""}">

            <div class="box-title-row">

                <input
                    class="box-title-input"
                    value="${escapeHTML(box.name)}"
                    onchange="renameBox('${type}', ${index}, this.value)"
                    title="يمكنك تغيير اسم المربع"
                >

                <button
                    class="box-edit"
                    onclick="focusBoxName('${type}', ${index})"
                    title="تغيير اسم المربع"
                >
                    ✏️
                </button>

            </div>

    `;


    box.tasks.forEach((task, taskIndex) => {

        html += renderInnerTask(
            type,
            index,
            task,
            taskIndex
        );

    });


    html += `

            <div class="box-footer">

                <button
                    onclick="addTask('${type}', ${index})"
                >
                    ➕ إضافة مهمة
                </button>

                ${
                    box.fixed
                        ? `<span style="margin:auto;color:var(--accent);font-weight:bold;">
                            📌 ثابتة
                           </span>`
                        : ""
                }

            </div>

        </div>

    `;


    return html;

}


function renderInnerTask(
    type,
    boxIndex,
    task,
    taskIndex
) {

    const status =
        task.status || "none";


    return `

        <div class="inner-task">

            <input
                class="task-text"
                value="${escapeHTML(task.text)}"
                placeholder="اكتب المهمة..."
                onchange="
                    updateTaskText(
                        '${type}',
                        ${boxIndex},
                        ${taskIndex},
                        this.value
                    )
                "
            >


            <input
                class="task-time"
                value="${escapeHTML(task.time)}"
                placeholder="الفترة الزمنية"
                onchange="
                    updateTaskTime(
                        '${type}',
                        ${boxIndex},
                        ${taskIndex},
                        this.value
                    )
                "
            >


            <button
                class="task-button star ${task.important ? "active-star" : ""}"
                onclick="
                    toggleImportant(
                        '${type}',
                        ${boxIndex},
                        ${taskIndex}
                    )
                "
                title="مهمة مهمة"
            >
                ⭐
            </button>


            <button
                class="task-button done ${status === "done" ? "active" : ""}"
                onclick="
                    setTaskStatus(
                        '${type}',
                        ${boxIndex},
                        ${taskIndex},
                        'done'
                    )
                "
                title="تم"
            >
                🟢
            </button>


            <button
                class="task-button not-done"
                onclick="
                    setTaskStatus(
                        '${type}',
                        ${boxIndex},
                        ${taskIndex},
                        'none'
                    )
                "
                title="لم يتم"
            >
                🔴
            </button>


            <button
                class="task-button delete-task"
                onclick="
                    deleteTask(
                        '${type}',
                        ${boxIndex},
                        ${taskIndex}
                    )
                "
                title="حذف المهمة"
            >
                🗑️
            </button>

        </div>

    `;

}


/* =====================================================
   تعديل اسم المربع
===================================================== */

function renameBox(type, index, value) {

    value = value.trim();


    if (!value) {

        value =
            index === 4
                ? "📌 مهام ثابتة"
                : `المربع ${index + 1}`;

    }


    data[type].boxes[index].name = value;

    saveData();

}


function focusBoxName(type, index) {

    renderPerson(type);


    setTimeout(() => {

        const inputs =
            document.querySelectorAll(
                type === "student"
                    ? "#studentContent .box-title-input"
                    : "#employeeContent .box-title-input"
            );


        if (inputs[index]) {

            inputs[index].focus();

            inputs[index].select();

        }

    }, 30);

}


/* =====================================================
   المهام
===================================================== */

function updateTaskText(
    type,
    boxIndex,
    taskIndex,
    value
) {

    data[type]
        .boxes[boxIndex]
        .tasks[taskIndex]
        .text = value;

    saveData();

    renderHome();

}


function updateTaskTime(
    type,
    boxIndex,
    taskIndex,
    value
) {

    data[type]
        .boxes[boxIndex]
        .tasks[taskIndex]
        .time = value;

    saveData();

}


function toggleImportant(
    type,
    boxIndex,
    taskIndex
) {

    const task =
        data[type]
            .boxes[boxIndex]
            .tasks[taskIndex];


    task.important =
        !task.important;


    saveData();

    renderPerson(type);

    renderHome();

    renderDashboard();

}


function setTaskStatus(
    type,
    boxIndex,
    taskIndex,
    status
) {

    const task =
        data[type]
            .boxes[boxIndex]
            .tasks[taskIndex];


    const wasDone =
        task.status === "done";


    task.status = status;


    const nowDone =
        status === "done";


    if (!wasDone && nowDone) {

        data.points += 10;

    }

    else if (wasDone && !nowDone) {

        data.points =
            Math.max(
                0,
                data.points - 10
            );

    }


    updateStreak();

    saveData();

    renderPerson(type);

    renderHome();

    renderDashboard();

}


function addTask(type, boxIndex) {

    data[type]
        .boxes[boxIndex]
        .tasks.push(
            createTask("")
        );


    saveData();

    renderPerson(type);

}


function deleteTask(
    type,
    boxIndex,
    taskIndex
) {

    data[type]
        .boxes[boxIndex]
        .tasks.splice(
            taskIndex,
            1
        );


    if (
        data[type]
            .boxes[boxIndex]
            .tasks.length === 0
    ) {

        data[type]
            .boxes[boxIndex]
            .tasks.push(
                createTask("")
            );

    }


    saveData();

    renderPerson(type);

}


/* =====================================================
   السلسلة والإنجازات
===================================================== */

function updateStreak() {

    const stats =
        getCombinedStats();


    if (
        stats.total > 0 &&
        stats.done === stats.total
    ) {

        const achievement =
            "perfect_" + todayKey();


        if (
            !data.achievements
                .includes(achievement)
        ) {

            data.achievements.push(
                achievement
            );

            data.streak += 1;

            data.points += 25;

        }

    }

}


/* =====================================================
   لوحة التحكم
===================================================== */

function renderDashboard() {

    const container =
        document.getElementById(
            "dashboardContent"
        );


    if (!container || !data) return;


    const student =
        getPersonStats("student");

    const employee =
        getPersonStats("employee");

    const combined =
        getCombinedStats();


    let taskTableTasks = 0;

    let taskTableDone = 0;


    data.tables.task.forEach(table => {

        table.cells.forEach(row => {

            row.forEach(cell => {

                if (
                    cell &&
                    typeof cell === "object" &&
                    cell.text &&
                    cell.text.trim()
                ) {

                    taskTableTasks++;

                    if (cell.done) {
                        taskTableDone++;
                    }

                }

            });

        });

    });


    const percent =
        combined.total
            ? Math.round(
                combined.done /
                combined.total * 100
            )
            : 0;


    container.innerHTML = `

        <div class="dashboard-grid">

            <div class="dashboard-card">
                <div class="icon">📚</div>
                <h3>مهام الطالب</h3>
                <div class="dashboard-number">
                    ${student.done} / ${student.total}
                </div>
            </div>


            <div class="dashboard-card">
                <div class="icon">💼</div>
                <h3>مهام الموظف</h3>
                <div class="dashboard-number">
                    ${employee.done} / ${employee.total}
                </div>
            </div>


            <div class="dashboard-card">
                <div class="icon">📅</div>
                <h3>مهام جداول المهام</h3>
                <div class="dashboard-number">
                    ${taskTableDone} / ${taskTableTasks}
                </div>
            </div>


            <div class="dashboard-card">
                <div class="icon">⭐</div>
                <h3>المهام المميزة</h3>
                <div class="dashboard-number">
                    ${combined.starsDone} / ${combined.stars}
                </div>
            </div>


            <div class="dashboard-card">

                <div class="icon">📊</div>

                <h3>نسبة الإنجاز</h3>

                <div class="dashboard-number">
                    ${percent}%
                </div>

                <div class="progress-track">

                    <div
                        class="progress-fill moving-gradient"
                        style="width:${percent}%"
                    ></div>

                </div>

            </div>


            <div class="dashboard-card">

                <div class="icon">🔥</div>

                <h3>الأيام المتتالية</h3>

                <div class="dashboard-number">
                    ${data.streak}
                </div>

            </div>


            <div class="dashboard-card">

                <div class="icon">🏆</div>

                <h3>المستوى</h3>

                <div class="dashboard-number">
                    ${getLevel()}
                </div>

                <p>
                    ${data.points} نقطة
                </p>

            </div>


            <div class="dashboard-card">

                <div class="icon">🎯</div>

                <h3>إجمالي المهام</h3>

                <div class="dashboard-number">
                    ${combined.total}
                </div>

            </div>

        </div>


        <div class="achievements">

            <h2>🏆 الإنجازات</h2>

            <div class="achievement-list">

                ${
                    data.achievements.length
                        ? data.achievements
                            .map(
                                a =>
                                    `<div class="achievement">
                                        🏆 إنجاز مكتسب
                                    </div>`
                            )
                            .join("")
                        : `<p>ابدئي بإنجاز مهامك للحصول على الإنجازات.</p>`
                }

            </div>

        </div>

    `;

}


function getLevel() {

    return Math.floor(
        data.points / 100
    ) + 1;

}


/* =====================================================
   الجداول
===================================================== */

function createGrid(
    rows,
    cols,
    taskTable = false
) {

    const cells = [];


    for (let r = 0; r < rows; r++) {

        const row = [];

        for (let c = 0; c < cols; c++) {

            row.push(
                taskTable
                    ? {
                        text: "",
                        done: false,
                        count: 0,
                        showControls: true
                    }
                    : ""
            );

        }

        cells.push(row);

    }


    return cells;

}


function addNormalTable() {

    data.tables.normal.push({

        name:
            `جدول ${data.tables.normal.length + 1}`,

        rows: 5,

        cols: 5,

        cells:
            createGrid(5, 5, false)

    });


    saveData();

    renderTables();

}


function addTaskTable() {

    data.tables.task.push({

        name:
            `جدول مهام ${data.tables.task.length + 1}`,

        rows: 5,

        cols: 5,

        cells:
            createGrid(5, 5, true)

    });


    saveData();

    renderTables();

}


function normalizeTable(table, taskTable) {

    if (!table.rows) {
        table.rows = 5;
    }

    if (!table.cols) {
        table.cols = 5;
    }

    if (!Array.isArray(table.cells)) {
        table.cells =
            createGrid(
                table.rows,
                table.cols,
                taskTable
            );
    }


    for (let r = 0; r < table.rows; r++) {

        if (!Array.isArray(table.cells[r])) {
            table.cells[r] = [];
        }


        for (
            let c = 0;
            c < table.cols;
            c++
        ) {

            if (
                table.cells[r][c] === undefined
            ) {

                table.cells[r][c] =
                    taskTable
                        ? {
                            text: "",
                            done: false,
                            count: 0,
                            showControls: true
                        }
                        : "";

            }


            if (taskTable) {

                const cell =
                    table.cells[r][c];


                if (
                    typeof cell !== "object"
                ) {

                    table.cells[r][c] = {

                        text: String(cell || ""),

                        done: false,

                        count: 0,

                        showControls: true

                    };

                }

                else {

                    if (typeof cell.text !== "string") {
                        cell.text = "";
                    }

                    if (typeof cell.count !== "number") {
                        cell.count = 0;
                    }

                    if (typeof cell.done !== "boolean") {
                        cell.done = cell.count > 0;
                    }

                    if (
                        typeof cell.showControls !== "boolean"
                    ) {
                        cell.showControls = true;
                    }

                }

            }

        }

    }

}


/* =====================================================
   عرض الجداول
===================================================== */

function renderTables() {

    renderNormalTables();

    renderTaskTables();

    renderWeeklyTable();

}


function renderNormalTables() {

    const container =
        document.getElementById(
            "normalTables"
        );


    let html = "";


    data.tables.normal.forEach(
        (table, index) => {

            normalizeTable(table, false);


            html += `

                <div class="table-card">

                    <div class="table-head">

                        <input
                            class="table-name"
                            value="${escapeHTML(table.name)}"
                            onchange="
                                renameTable(
                                    'normal',
                                    ${index},
                                    this.value
                                )
                            "
                        >

                        <button
                            onclick="
                                addTableRow(
                                    'normal',
                                    ${index}
                                )
                            "
                        >
                            ➕ صف
                        </button>

                        <button
                            onclick="
                                removeTableRow(
                                    'normal',
                                    ${index}
                                )
                            "
                        >
                            ➖ صف
                        </button>

                        <button
                            onclick="
                                addTableColumn(
                                    'normal',
                                    ${index}
                                )
                            "
                        >
                            ➕ عمود
                        </button>

                        <button
                            onclick="
                                removeTableColumn(
                                    'normal',
                                    ${index}
                                )
                            "
                        >
                            ➖ عمود
                        </button>

                        <button
                            onclick="
                                copyTable(
                                    'normal',
                                    ${index}
                                )
                            "
                        >
                            📋
                        </button>

                        <button
                            onclick="
                                deleteTable(
                                    'normal',
                                    ${index}
                                )
                            "
                        >
                            🗑️
                        </button>

                    </div>


                    <div class="table-scroll">

                        <table class="custom-table">

                            <tbody>

                                ${
                                    table.cells
                                        .map(
                                            (row, r) => `

                                            <tr>

                                                ${
                                                    row
                                                        .map(
                                                            (cell, c) => `

                                                            <td>

                                                                <textarea
                                                                    onchange="
                                                                        updateNormalCell(
                                                                            ${index},
                                                                            ${r},
                                                                            ${c},
                                                                            this.value
                                                                        )
                                                                    "
                                                                >${escapeHTML(cell)}</textarea>

                                                            </td>

                                                        `
                                                        )
                                                        .join("")
                                                }

                                            </tr>

                                        `
                                        )
                                        .join("")
                                }

                            </tbody>

                        </table>

                    </div>

                </div>

            `;

        }
    );


    if (!html) {

        html = `
            <div class="info-card">
                <p>لم تتم إضافة جدول عادي بعد.</p>
            </div>
        `;

    }


    container.innerHTML = html;

}


function renderTaskTables() {

    const container =
        document.getElementById(
            "taskTables"
        );


    let html = "";


    data.tables.task.forEach(
        (table, index) => {

            normalizeTable(table, true);


            let total = 0;

            let done = 0;


            table.cells.forEach(row => {

                row.forEach(cell => {

                    if (
                        cell.text &&
                        cell.text.trim()
                    ) {

                        total++;

                        if (cell.done) {
                            done++;
                        }

                    }

                });

            });


            const percent =
                total
                    ? Math.round(
                        done / total * 100
                    )
                    : 0;


            html += `

                <div class="table-card">

                    <div class="table-head">

                        <input
                            class="table-name"
                            value="${escapeHTML(table.name)}"
                            onchange="
                                renameTable(
                                    'task',
                                    ${index},
                                    this.value
                                )
                            "
                        >

                        <button
                            onclick="
                                addTableRow(
                                    'task',
                                    ${index}
                                )
                            "
                        >
                            ➕ صف
                        </button>

                        <button
                            onclick="
                                removeTableRow(
                                    'task',
                                    ${index}
                                )
                            "
                        >
                            ➖ صف
                        </button>

                        <button
                            onclick="
                                addTableColumn(
                                    'task',
                                    ${index}
                                )
                            "
                        >
                            ➕ عمود
                        </button>

                        <button
                            onclick="
                                removeTableColumn(
                                    'task',
                                    ${index}
                                )
                            "
                        >
                            ➖ عمود
                        </button>

                        <button
                            onclick="
                                deleteTable(
                                    'task',
                                    ${index}
                                )
                            "
                        >
                            🗑️
                        </button>

                    </div>


                    <div style="margin-bottom:15px">

                        <span>
                            📊 ${done} / ${total}
                            — ${percent}%
                        </span>

                        <div class="progress-track">

                            <div
                                class="progress-fill moving-gradient"
                                style="width:${percent}%"
                            ></div>

                        </div>

                    </div>


                    <div class="task-table-wrapper">

                        <div class="task-table-main">

                            <div class="table-scroll">

                                <table class="custom-table">

                                    <tbody>

                                        ${
                                            table.cells
                                                .map(
                                                    (row, r) => `

                                                    <tr>

                                                        ${
                                                            row
                                                                .map(
                                                                    (cell, c) => {

                                                                        const controls =
                                                                            cell.showControls !== false;


                                                                        return `

                                                                            <td class="task-cell">

                                                                                <textarea
                                                                                    onchange="
                                                                                        updateTaskCellText(
                                                                                            ${index},
                                                                                            ${r},
                                                                                            ${c},
                                                                                            this.value
                                                                                        )
                                                                                    "
                                                                                >${escapeHTML(cell.text)}</textarea>


                                                                                ${
                                                                                    controls
                                                                                        ? `

                                                                                        <div class="task-cell-controls">

                                                                                            <button
                                                                                                class="circle-control green-control"
                                                                                                onclick="
                                                                                                    taskCellGreen(
                                                                                                        ${index},
                                                                                                        ${r},
                                                                                                        ${c}
                                                                                                    )
                                                                                                "
                                                                                            >
                                                                                                +
                                                                                            </button>


                                                                                            <span class="cell-count">
                                                                                                ${cell.count || 0}
                                                                                            </span>


                                                                                            <button
                                                                                                class="circle-control red-control"
                                                                                                onclick="
                                                                                                    taskCellRed(
                                                                                                        ${index},
                                                                                                        ${r},
                                                                                                        ${c}
                                                                                                    )
                                                                                                "
                                                                                            >
                                                                                                −
                                                                                            </button>


                                                                                            <button
                                                                                                class="hide-cell-controls"
                                                                                                onclick="
                                                                                                    toggleCellControls(
                                                                                                        ${index},
                                                                                                        ${r},
                                                                                                        ${c}
                                                                                                    )
                                                                                                "
                                                                                            >
                                                                                                ✕
                                                                                            </button>

                                                                                        </div>

                                                                                    `
                                                                                        : `
                                                                                        <div class="task-cell-controls">

                                                                                            <button
                                                                                                class="hide-cell-controls"
                                                                                                onclick="
                                                                                                    toggleCellControls(
                                                                                                        ${index},
                                                                                                        ${r},
                                                                                                        ${c}
                                                                                                    )
                                                                                                "
                                                                                            >
                                                                                                ＋ إظهار
                                                                                            </button>

                                                                                        </div>
                                                                                    `
                                                                                }

                                                                            </td>

                                                                        `;

                                                                    }
                                                                )
                                                                .join("")
                                                        }

                                                    </tr>

                                                `
                                                )
                                                .join("")
                                        }

                                    </tbody>

                                </table>

                            </div>

                        </div>


                        <div class="vertical-progress">

                            <div
                                class="vertical-progress-fill"
                                style="height:${percent}%"
                            ></div>

                        </div>

                    </div>

                </div>

            `;

        }
    );


    if (!html) {

        html = `
            <div class="info-card">
                <p>لم تتم إضافة جدول مهام بعد.</p>
            </div>
        `;

    }


    container.innerHTML = html;

}


/* =====================================================
   خلايا الجداول
===================================================== */

function updateNormalCell(
    tableIndex,
    row,
    col,
    value
) {

    data.tables.normal[tableIndex]
        .cells[row][col] = value;

    saveData();

}


function updateTaskCellText(
    tableIndex,
    row,
    col,
    value
) {

    const cell =
        data.tables.task[tableIndex]
            .cells[row][col];


    cell.text = value;


    if (!value.trim()) {

        cell.done = false;

        cell.count = 0;

    }


    saveData();

    renderTaskTables();

    renderDashboard();

}


function taskCellGreen(
    tableIndex,
    row,
    col
) {

    const cell =
        data.tables.task[tableIndex]
            .cells[row][col];


    cell.count =
        Number(cell.count || 0) + 1;


    cell.done = true;


    data.points += 5;


    saveData();

    renderTaskTables();

    renderDashboard();

}


function taskCellRed(
    tableIndex,
    row,
    col
) {

    const cell =
        data.tables.task[tableIndex]
            .cells[row][col];


    cell.count =
        Math.max(
            0,
            Number(cell.count || 0) - 1
        );


    cell.done =
        cell.count > 0;


    saveData();

    renderTaskTables();

    renderDashboard();

}


function toggleCellControls(
    tableIndex,
    row,
    col
) {

    const cell =
        data.tables.task[tableIndex]
            .cells[row][col];


    cell.showControls =
        cell.showControls === false;


    saveData();

    renderTaskTables();

}


/* =====================================================
   الصفوف والأعمدة
===================================================== */

function addTableRow(type, index) {

    const table =
        data.tables[type][index];


    normalizeTable(
        table,
        type === "task"
    );


    table.rows++;


    const newRow = [];


    for (
        let c = 0;
        c < table.cols;
        c++
    ) {

        newRow.push(
            type === "task"
                ? {
                    text: "",
                    done: false,
                    count: 0,
                    showControls: true
                }
                : ""
        );

    }


    table.cells.push(newRow);


    saveData();

    renderTables();

}


function removeTableRow(type, index) {

    const table =
        data.tables[type][index];


    if (table.rows <= 1) {

        alert("يجب أن يبقى صف واحد على الأقل.");

        return;

    }


    table.rows--;

    table.cells.pop();


    saveData();

    renderTables();

}


function addTableColumn(type, index) {

    const table =
        data.tables[type][index];


    normalizeTable(
        table,
        type === "task"
    );


    table.cols++;


    table.cells.forEach(row => {

        row.push(

            type === "task"
                ? {
                    text: "",
                    done: false,
                    count: 0,
                    showControls: true
                }
                : ""

        );

    });


    saveData();

    renderTables();

}


function removeTableColumn(type, index) {

    const table =
        data.tables[type][index];


    if (table.cols <= 1) {

        alert("يجب أن يبقى عمود واحد على الأقل.");

        return;

    }


    table.cols--;


    table.cells.forEach(row => {

        row.pop();

    });


    saveData();

    renderTables();

}


/* =====================================================
   أسماء ونسخ وحذف الجداول
===================================================== */

function renameTable(
    type,
    index,
    value
) {

    data.tables[type][index].name =
        value.trim() ||
        `جدول ${index + 1}`;


    saveData();

}


function copyTable(type, index) {

    const copy =
        JSON.parse(
            JSON.stringify(
                data.tables[type][index]
            )
        );


    copy.name += " - نسخة";


    data.tables[type].push(copy);


    saveData();

    renderTables();

}


function deleteTable(type, index) {

    if (
        !confirm(
            "هل تريد حذف هذا الجدول؟"
        )
    ) {
        return;
    }


    data.tables[type].splice(
        index,
        1
    );


    saveData();

    renderTables();

}


/* =====================================================
   الجدول الأسبوعي
===================================================== */

function renderWeeklyTable() {

    const container =
        document.getElementById(
            "weeklyTable"
        );


    const days =
        data.tables.weekly.days;


    if (
        !Array.isArray(
            data.tables.weekly.cells
        ) ||
        data.tables.weekly.cells.length !== 24
    ) {

        data.tables.weekly.cells =
            Array.from(
                { length: 4 },
                () =>
                    Array.from(
                        { length: 7 },
                        () => ""
                    )
            );

        saveData();

    }


    let html = `

        <div class="table-scroll">

            <table class="weekly-table">

                <thead>

                    <tr>

                        <th>الفترة</th>

                        ${days.map(
                            day =>
                                `<th>${day}</th>`
                        ).join("")}

                    </tr>

                </thead>

                <tbody>

    `;


    const periods = [
        "الصباح",
        "الظهر",
        "العصر",
        "المساء"
    ];


    periods.forEach((period, r) => {

        html += `

            <tr>

                <th>${period}</th>

                ${
                    days
                        .map(
                            (day, c) => `

                                <td>

                                    <textarea
                                        onchange="
                                            updateWeeklyCell(
                                                ${r},
                                                ${c},
                                                this.value
                                            )
                                        "
                                    >${escapeHTML(
                                        data.tables.weekly.cells[r][c]
                                    )}</textarea>

                                </td>

                            `
                        )
                        .join("")
                }

            </tr>

        `;

    });


    html += `

                </tbody>

            </table>

        </div>

    `;


    container.innerHTML = html;

}


function updateWeeklyCell(
    row,
    col,
    value
) {

    data.tables.weekly.cells[row][col] =
        value;

    saveData();

}


/* =====================================================
   الملاحظات
===================================================== */

function renderNotes() {

    if (!data) return;


    const title =
        document.getElementById(
            "notesTitle"
        );

    const body =
        document.getElementById(
            "notesBody"
        );


    if (title) {
        title.value =
            data.notes.title || "";
    }

    if (body) {
        body.value =
            data.notes.body || "";
    }

}


function saveNotes() {

    if (!data) return;


    data.notes.title =
        document.getElementById(
            "notesTitle"
        ).value;


    data.notes.body =
        document.getElementById(
            "notesBody"
        ).value;


    saveData();


    const message =
        document.getElementById(
            "notesSaved"
        );


    if (message) {

        message.textContent =
            "✓ تم الحفظ";

        setTimeout(() => {

            message.textContent =
                "✓ يتم الحفظ تلقائياً";

        }, 1200);

    }

}


/* =====================================================
   الإعدادات
===================================================== */

function renderSettings() {

    if (!data) return;


    const username =
        document.getElementById(
            "settingsUsername"
        );


    const accent =
        document.getElementById(
            "accentColor"
        );


    const notifications =
        document.getElementById(
            "notificationsToggle"
        );


    const reminder =
        document.getElementById(
            "reminderTime"
        );


    if (username) {
        username.value =
            data.username || "";
    }


    if (accent) {
        accent.value =
            data.settings.accent ||
            "#1976d2";
    }


    if (notifications) {

        notifications.checked =
            !!data.settings.notifications;

    }


    if (reminder) {

        reminder.value =
            data.settings.reminderTime ||
            "18:00";

    }

}


function saveUsername() {

    const input =
        document.getElementById(
            "settingsUsername"
        );


    const value =
        input.value.trim();


    if (!value) {

        alert("اكتبي اسم المستخدم.");

        return;

    }


    data.username = value;

    saveData();

    renderHome();

    alert("تم حفظ اسم المستخدم.");

}


function changeAccent(color) {

    if (!data) return;


    data.settings.accent =
        color;


    applyAccent(color);

    saveData();

    renderSettings();

}


function applyAccent(color) {

    document.documentElement
        .style
        .setProperty(
            "--accent",
            color
        );


    document.documentElement
        .style
        .setProperty(
            "--accent-soft",
            hexToRGBA(color, .14)
        );


    document.documentElement
        .style
        .setProperty(
            "--accent-border",
            hexToRGBA(color, .35)
        );

}


function hexToRGBA(hex, alpha) {

    hex =
        hex.replace("#", "");


    if (hex.length === 3) {

        hex =
            hex
                .split("")
                .map(x => x + x)
                .join("");

    }


    const r =
        parseInt(
            hex.substring(0, 2),
            16
        );

    const g =
        parseInt(
            hex.substring(2, 4),
            16
        );

    const b =
        parseInt(
            hex.substring(4, 6),
            16
        );


    return `rgba(${r},${g},${b},${alpha})`;

}


/* =====================================================
   الوضع الليلي
===================================================== */

function toggleDarkMode() {

    if (!data) return;


    data.settings.dark =
        !data.settings.dark;


    applySettings();

    saveData();

    renderSettings();

}


function applySettings() {

    if (!data) return;


    document.body.classList.toggle(
        "dark",
        !!data.settings.dark
    );


    applyAccent(
        data.settings.accent ||
        "#1976d2"
    );

}


/* =====================================================
   التنبيهات
===================================================== */

async function toggleNotifications() {

    if (!data) return;


    const enabled =
        document.getElementById(
            "notificationsToggle"
        ).checked;


    if (
        enabled &&
        "Notification" in window
    ) {

        const permission =
            await Notification.requestPermission();


        if (permission !== "granted") {

            data.settings.notifications =
                false;

            document.getElementById(
                "notificationsToggle"
            ).checked = false;


            alert(
                "لم يتم السماح بإشعارات المتصفح."
            );


            saveData();

            return;

        }

    }


    data.settings.notifications =
        enabled;


    saveData();

    scheduleNotifications();

}


function saveReminderTime() {

    data.settings.reminderTime =
        document.getElementById(
            "reminderTime"
        ).value;


    saveData();

    scheduleNotifications();

}


function scheduleNotifications() {

    if (reminderTimer) {

        clearInterval(
            reminderTimer
        );

    }


    if (
        !data ||
        !data.settings.notifications
    ) {
        return;
    }


    reminderTimer =
        setInterval(
            checkReminder,
            30000
        );


    checkReminder();

}


function checkReminder() {

    if (
        !data ||
        !data.settings.notifications
    ) {
        return;
    }


    if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {
        return;
    }


    const now =
        new Date();


    const hours =
        String(
            now.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            now.getMinutes()
        ).padStart(2, "0");


    const currentTime =
        `${hours}:${minutes}`;


    const today =
        todayKey();


    if (
        currentTime ===
        data.settings.reminderTime &&
        data.settings.lastReminder !== today
    ) {

        new Notification(
            "⏰ تذكير من كن منظما",
            {
                body:
                    "حان وقت مراجعة مهامك اليومية."
            }
        );


        data.settings.lastReminder =
            today;


        saveData();

    }

}


/* =====================================================
   تغيير رمز الدخول
===================================================== */

function changeCode() {

    const oldCode =
        document.getElementById(
            "oldCode"
        ).value;


    const newCode =
        document.getElementById(
            "newCode"
        ).value;


    const confirm =
        document.getElementById(
            "newCodeConfirm"
        ).value;


    if (oldCode !== currentCode) {

        alert(
            "رمز الدخول الحالي غير صحيح."
        );

        return;

    }


    if (newCode.length < 3) {

        alert(
            "الرمز الجديد يجب أن يكون 3 أحرف أو أرقام على الأقل."
        );

        return;

    }


    if (newCode !== confirm) {

        alert(
            "الرمز الجديد غير متطابق."
        );

        return;

    }


    if (
        localStorage.getItem(
            accountKey(newCode)
        )
    ) {

        alert(
            "هذا الرمز مستخدم بالفعل."
        );

        return;

    }


    const oldKey =
        accountKey(currentCode);


    currentCode =
        newCode;


    localStorage.setItem(
        accountKey(currentCode),
        JSON.stringify(data)
    );


    localStorage.removeItem(
        oldKey
    );


    localStorage.setItem(
        CURRENT_KEY,
        currentCode
    );


    document.getElementById(
        "oldCode"
    ).value = "";

    document.getElementById(
        "newCode"
    ).value = "";

    document.getElementById(
        "newCodeConfirm"
    ).value = "";


    alert(
        "تم تغيير رمز الدخول بنجاح."
    );

}


/* =====================================================
   تصدير البيانات
===================================================== */

function exportData() {

    const json =
        JSON.stringify(
            data,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const a =
        document.createElement(
            "a"
        );


    a.href = url;

    a.download =
        "كن-منظما-بيانات.json";


    a.click();


    URL.revokeObjectURL(url);

}


/* =====================================================
   استيراد البيانات
===================================================== */

function importData(event) {

    const file =
        event.target.files[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload = function () {

        try {

            const imported =
                migrateData(
                    JSON.parse(
                        reader.result
                    )
                );


            data = imported;


            saveData();

            applySettings();

            renderAll();


            alert(
                "تم استيراد البيانات بنجاح."
            );

        }

        catch (error) {

            console.error(error);

            alert(
                "ملف البيانات غير صالح."
            );

        }

    };


    reader.readAsText(file);

}


/* =====================================================
   حذف الحساب
===================================================== */

function deleteAccount() {

    const answer =
        confirm(
            "هل أنت متأكدة من حذف الحساب وجميع البيانات؟"
        );


    if (!answer) return;


    localStorage.removeItem(
        accountKey(currentCode)
    );


    localStorage.removeItem(
        CURRENT_KEY
    );


    data = null;

    currentCode = null;


    document.getElementById(
        "app"
    ).classList.add("hidden");


    document.getElementById(
        "authScreen"
    ).classList.remove("hidden");


    showLogin();

}


/* =====================================================
   تسجيل الخروج
===================================================== */

function logout() {

    localStorage.removeItem(
        CURRENT_KEY
    );


    if (reminderTimer) {

        clearInterval(
            reminderTimer
        );

    }


    data = null;

    currentCode = null;


    document.getElementById(
        "app"
    ).classList.add("hidden");


    document.getElementById(
        "authScreen"
    ).classList.remove("hidden");


    document.getElementById(
        "loginCode"
    ).value = "";


    showLogin();

}


/* =====================================================
   أدوات الجداول
===================================================== */

function scrollToSection(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* =====================================================
   تشغيل الحساب المحفوظ
===================================================== */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        const savedCode =
            localStorage.getItem(
                CURRENT_KEY
            );


        if (savedCode) {

            const raw =
                localStorage.getItem(
                    accountKey(savedCode)
                );


            if (raw) {

                try {

                    data =
                        migrateData(
                            JSON.parse(raw)
                        );

                    currentCode =
                        savedCode;


                    openApp();

                }

                catch (error) {

                    console.error(error);

                    localStorage.removeItem(
                        CURRENT_KEY
                    );

                }

            }

        }

    }
);