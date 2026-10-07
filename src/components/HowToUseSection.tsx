import React from 'react';
import { ActiveTab } from '../types';

interface FAQItem {
  question: string;
  answer: string;
}

interface StepItem {
  title: string;
  desc: string;
}

interface PillarItem {
  title: string;
  desc: string;
}

interface DeepDiveItem {
  title: string;
  desc: string;
}

interface PageArticleData {
  badge: string;
  title: string;
  subtitle: string;
  intro: string;
  philosophyTitle: string;
  philosophyText: string[];
  howItWorksIntro: string;
  howItWorksSteps: StepItem[];
  keyTipsTitle: string;
  keyTips: PillarItem[];
  workflowTitle: string;
  workflowText: string[];
  deepDiveTitle: string;
  deepDiveSections: DeepDiveItem[];
  faqTitle: string;
  faqs: FAQItem[];
}

interface HowToUseSectionProps {
  activeTab: ActiveTab;
}

export const HowToUseSection: React.FC<HowToUseSectionProps> = ({ activeTab }) => {
  const getArticleData = (): PageArticleData => {
    switch (activeTab) {
      case 'dashboard':
        return {
          badge: 'StudyLawn Field Guide • Overview & Focus Cockpit',
          title: 'The Focus Cockpit: How to Track Honest Hours and Build Real Momentum',
          subtitle:
            'A practical, human guide to mastering your daily study hours, conquering procrastination, and building an unbreakable learning habit.',
          intro:
            'Welcome to StudyLawn. We built this app around a simple truth that every serious student discovers sooner or later: what counts is not how many hours you sit at a desk with your phone in your lap, but how many hours of honest, uninterrupted focus you actually deliver. Most students trick themselves into thinking they studied for eight hours because their books were open from morning until dinner, even though seven of those hours were lost to text messages, video rabbit holes, and wandering thoughts. StudyLawn is your personal focus cockpit designed to cut through that noise. There is no sign-up needed, no account to create, no passwords to memorize, and no subscription fees. You open the app in your browser, set your goal, start your timer, and get straight to work. All of your data stays 100% private and stored locally on your device.',
          philosophyTitle: 'The StudyLawn Motto: Honest Hours Over Fake Busyness',
          philosophyText: [
            'Our core motto is simple: "Quiet focus over loud ambition. Show up, clock the honest hours, and trust the compound effect." In the modern world, students are bombarded with endless aesthetic study vlogs, color-coded stationery, and elaborate productivity systems that take more time to organize than actual studying. Real academic mastery does not come from looking busy. It comes from sitting down with difficult material, removing every single distraction, and putting in two, four, or six hours of deliberate mental effort day after day.',
            'When you click the timer in StudyLawn, you make a clear personal agreement with yourself: while this clock is ticking, you are working. When you need a break, you pause it. That single habit of keeping an unvarnished, second-by-second record of your real work changes everything. You stop ending your evenings with that vague, guilty feeling of wondering where your time went. Instead, you look at your dashboard, see an honest tally of four solid hours of Mathematics and Chemistry, and you can close your books and enjoy your evening with complete peace of mind.'
          ],
          howItWorksIntro: 'Step-by-Step Suggestions: How to Run Your Daily Study Sessions',
          howItWorksSteps: [
            {
              title: '1. Set an Honest Daily Target First Thing in the Morning',
              desc: 'Click on the Daily Target card at the top left of your dashboard. Choose a realistic number of hours based on your schedule today—perhaps 3.5 hours on busy school days or 6.0 hours on an open weekend. Setting a target early creates an intentional finish line so you do not drift aimlessly or study until late-night burnout.'
            },
            {
              title: '2. Pick the Right Timer Mode for Your Work',
              desc: 'Use Countdown mode when you want structured sprints—like a 25-minute Pomodoro block or a 50-minute practice test. Use Stopwatch mode when you are reading deeply, writing essays, or solving complex equations where an arbitrary alarm might interrupt your peak flow state.'
            },
            {
              title: '3. Do the 60-Second Pre-Flight Check Before Hitting Start',
              desc: 'Before you press Start, run through the pre-flight checklist directly below the timer: fill up your water bottle, put your phone in another room or on silent mode, and have your exact textbook or notes ready. Eliminating small excuses to get up keeps you glued to your chair during the session.'
            },
            {
              title: '4. Expand to Fullscreen or Pop Out the Mini Timer',
              desc: 'If you want zero visual distractions on your screen, click the Fullscreen Focus button. If you are reading PDF lecture notes or watching an online seminar, open the Popout Timer into a compact floating desktop window that stays quietly in the corner of your screen while you work.'
            },
            {
              title: '5. Rest Without Looking at Screens',
              desc: 'When your timer finishes, take a genuine break. Stand up, stretch, drink water, or look out the window for five minutes. Avoid opening short-form video feeds during your break—scrolling social media floods your brain with cheap dopamine and makes it twice as hard to return to deep work.'
            },
            {
              title: '6. Check Off Tasks on the Live Daily Board',
              desc: 'Directly below the timer, use your daily task checklist to mark off completed assignments in real time. You can toggle between Today and Tomorrow, adjust priority tags, and keep yourself focused on your single next action without jumping between different tabs.'
            },
            {
              title: '7. Watch Your Streak Grow on the Study Calendar',
              desc: 'Scroll down to the Study Calendar at the bottom of the overview. Each day you study, your hours are recorded and color-coded. If you spent the afternoon studying with physical books at the library away from your computer, click the Log Hours button to manually record those offline hours so your streak stays unbroken.'
            }
          ],
          keyTipsTitle: 'The Four Pillars of the Overview Focus Cockpit',
          keyTips: [
            {
              title: 'Hardware-Clock Precision',
              desc: 'Unlike simple browser timers that freeze or slow down when your tab is in the background, StudyLawn uses system hardware timestamps. Your timer keeps 100% accurate time even if your laptop goes to sleep or you switch windows.'
            },
            {
              title: 'No Sign-Up & Total Local Privacy',
              desc: 'No sign-up is needed. There are no accounts, no logins, no cloud tracking, and no ads. All your hours, targets, and notes remain stored securely right in your browser on your own computer.'
            },
            {
              title: 'Popout & Dual-Screen Ready',
              desc: 'Use the floating miniature desktop widget to keep your study timer visible right alongside your digital textbooks, coding IDEs, or video lectures without taking up valuable screen space.'
            },
            {
              title: 'The Compound Power of Streaks',
              desc: 'Building a consistent streak of even 2 honest hours every single day beats cramming for 14 hours once a week. The calendar provides clear visual proof of your consistency over time.'
            }
          ],
          workflowTitle: 'How the Overview Connects With Your Whole Study Routine',
          workflowText: [
            'The Overview Dashboard is your daily home base. When you wake up, glance at your daily target and check off any quick morning priorities. As you move into the day, your scheduled study blocks from the Planner tab automatically appear above the timer, telling you exactly what subject you should be tackling right now and how many minutes remain in that block.',
            'When you complete assignments in your Tasks queue, they reflect immediately on your dashboard. And whenever you need to look up a formula sheet, review a textbook summary, or log an exam mistake, the Vault is just one click away. By bringing everything together in a single, calm interface, StudyLawn keeps you in a state of focused execution.'
          ],
          deepDiveTitle: 'Practical Suggestions You Can Take From Outside the App',
          deepDiveSections: [
            {
              title: 'The Two-Minute Rule: How to Beat Study Inertia',
              desc: 'The hardest part of studying is almost always the first two minutes. When you feel tired, overwhelmed, or resistant to opening a heavy textbook, tell yourself: "I am only going to open the book and study for two minutes." Set the StudyLawn timer for just two minutes. Once you overcome the initial friction of sitting down and reading the first sentence, your brain naturally engages, and in 90% of cases, you will comfortably keep going for the rest of the hour.'
            },
            {
              title: 'Eat the Frog: Start With Your Hardest Subject',
              desc: 'Mark Twain famously advised that if your job is to eat a frog, it is best to do it first thing in the morning. For students, the "frog" is that intimidating calculus chapter, organic chemistry mechanism, or dense essay draft you have been avoiding. Your willpower and mental energy are highest during your first study block of the day. Knock out your hardest subject first; once that is done, the rest of your study day feels light, easy, and stress-free.'
            },
            {
              title: 'The 50/10 Rhythm vs. 90-Minute Deep Flow',
              desc: 'Experiment with session lengths to find what fits your subject. For memorization, vocabulary flashcards, and quick problem sets, 50 minutes of study followed by a 10-minute break works wonders to prevent fatigue. For writing essays, deriving proofs, or deep analytical problem-solving, give yourself a 90-minute block so your brain has enough runway to get into deep, uninterrupted flow.'
            }
          ],
          faqTitle: 'Common Questions About Tracking Your Study Hours',
          faqs: [
            {
              question: 'Do I really not need an account or sign-up to use StudyLawn?',
              answer:
                'No sign-up is needed whatsoever. You never have to hand over your email, set a password, or verify an account. You can bookmark StudyLawn and use it instantly every day. All your settings, study logs, schedules, and notes are saved directly inside your browser storage (IndexedDB).'
            },
            {
              question: 'Does the timer keep counting if I switch tabs or minimize the window?',
              answer:
                'Yes. StudyLawn calculates elapsed time using high-precision hardware timestamps instead of relying on basic browser tick counters. Even if your browser suspends background tabs to save battery, your study time will be 100% accurate the moment you return.'
            },
            {
              question: 'What should I do if I studied offline at a library or with paper books?',
              answer:
                'You do not have to keep your laptop running. In the Study Calendar at the bottom of the Overview page, click the "Log Hours" button. Choose the date, enter your hours and minutes, and click Save. Your daily total and streak will update instantly.'
            },
            {
              question: 'How do I make sure I do not lose my study logs if I clear my browser?',
              answer:
                'Go to the Settings tab (gear icon in the sidebar) and click "Export Backup". This downloads a simple JSON file containing all your study logs, schedules, and notes. You can import this file back into any browser or computer in seconds.'
            },
            {
              question: 'How many hours should I target each day as a student?',
              answer:
                'Quality beats quantity every time. Three to five honest, focused hours with zero phone distractions will consistently outperform eight hours of fragmented, half-hearted studying. Start with a target of 3.5 to 4 hours and gradually build up your stamina.'
            }
          ]
        };

      case 'timetable':
        return {
          badge: 'StudyLawn Field Guide • Planner & Timetable Maker',
          title: 'The Daily Timetable: Designing Your Schedule and Eliminating Decision Fatigue',
          subtitle:
            'How to time-block your study days, automate routines with templates, and stay ahead of your syllabus without burning out.',
          intro:
            'One of the most common reasons students fail to achieve their study goals has nothing to do with intelligence or motivation—it is decision fatigue. When you wake up in the morning without a clear plan, you spend half your mental energy debating what to study, when to start, and which subject is most urgent. By lunchtime, you have exhausted your willpower before doing any meaningful work. The StudyLawn Planner exists to solve this problem permanently. By turning your day into clear, structured time blocks, you always know exactly what to do next. Best of all, no sign-up is needed. You can create custom schedules, save routine templates, and organize your study week with total privacy right inside your browser.',
          philosophyTitle: 'The StudyLawn Motto: Plan the Work, Work the Plan',
          philosophyText: [
            'Our planning philosophy is grounded in one rule: "Decide before you sit down." When you try to plan your work in the exact moment you are supposed to study, resistance wins every time. You gravitate toward the easiest chapter or clean your desk instead of solving difficult practice problems. A good timetable takes decision-making out of the equation. When 10:00 AM arrives and your schedule says "Calculus Integration," you do not debate it; you simply open Calculus and start the timer.',
            'A great study plan is not a prison—it is your personal protection against chaos. It ensures that every important subject receives dedicated attention while also carving out guilt-free time for meals, exercise, and proper sleep. When you stick to your planned blocks, you finish your study day with the confidence that you covered everything that mattered.'
          ],
          howItWorksIntro: 'Step-by-Step Suggestions: How to Build and Master Your Timetable',
          howItWorksSteps: [
            {
              title: '1. Create Your Core Study Slots for the Day',
              desc: 'Click the "Add Slot" button at the top of the Planner page. Enter a clear subject title (such as "Morning Session: Organic Chemistry"), choose your start and end times, and add any specific topics in the notes field. Your schedule immediately renders the card with live progress badges.'
            },
            {
              title: '2. Link Real Tasks Directly to Time Slots',
              desc: 'When creating or editing a study slot, use the "Assigned Task" selector to link a specific item from your Tasks list. When that time block begins, you will see the exact chapter, practice test, or reading assignment attached to the slot so you never waste time looking for materials.'
            },
            {
              title: '3. Use the Auto-Fill Feature to Build Days in One Click',
              desc: 'If you have empty study blocks on your schedule, click the "Auto-Fill Tasks" button with the lightning bolt icon. StudyLawn will automatically match your pending high-priority tasks into open timetable slots based on priority and duration, giving you an optimized daily itinerary in seconds.'
            },
            {
              title: '4. Save Your Best Days as Reusable Routine Templates',
              desc: 'Once you find a daily layout that works well, click "Save Routine". Give it a clear name like "Standard Weekday", "Weekend Revision Blitz", or "Exam Week Intensive". StudyLawn saves the entire layout permanently in your local template library.'
            },
            {
              title: '5. Load Saved Templates in the Morning with One Click',
              desc: 'Instead of manually rebuilding your schedule every morning, click the "Templates" button and load your preferred routine. In one second, your entire day is scheduled, leaving you free to focus 100% of your energy on learning.'
            },
            {
              title: '6. Follow the Live Active Slot Indicator',
              desc: 'The planner automatically highlights whichever slot matches the current time of day. It displays a live progress bar showing exactly how many minutes remain in your current session, keeping you anchored to the present moment.'
            },
            {
              title: '7. Mark Slots Complete and Review Your Scheduled Hours',
              desc: 'As you complete each study block, click the checkmark on the card. The planner tallies your completed scheduled hours for the day, giving you a clear sense of achievement and accountability.'
            }
          ],
          keyTipsTitle: 'The Four Golden Rules of a Sustainable Study Timetable',
          keyTips: [
            {
              title: 'Rule I: Always Leave 15-Minute Buffers',
              desc: 'Never schedule back-to-back study blocks without a 15-minute buffer. Life happens: lectures run late, problems take longer than expected, or you need a snack. Buffers keep your day on track when unexpected delays happen.'
            },
            {
              title: 'Rule II: Interleave Different Subjects',
              desc: 'Avoid scheduling six straight hours of a single subject. Switching between two different topics (for example, Physics in the morning and History in the afternoon) keeps your brain alert and prevents mental saturation.'
            },
            {
              title: 'Rule III: Protect Your Morning Hours',
              desc: 'Put your most challenging cognitive tasks into your earliest study slots. Mornings have the fewest distractions and your willpower is at its peak. Save lighter review and reading for the evening.'
            },
            {
              title: 'Rule IV: Plan Tomorrow Tonight',
              desc: 'Spend three minutes at the end of each evening setting up tomorrow’s timetable. Waking up with a schedule already locked in removes all morning friction and lets you start studying immediately.'
            }
          ],
          workflowTitle: 'Connecting Your Timetable With the Rest of StudyLawn',
          workflowText: [
            'The Planner works hand-in-hand with your Overview Dashboard and Tasks queue. When a scheduled study slot becomes active, you will see it highlighted right above the focus timer on the Overview page, keeping your daily schedule front and center while you track your hours.',
            'Furthermore, tasks created in the Tasks tab can be dragged or assigned directly into timetable slots. When you finish studying a slot, you can head over to the Vault to file your notes and test reviews under that specific subject folder, creating a seamless, organized loop from planning to execution to long-term review.'
          ],
          deepDiveTitle: 'Practical Scheduling Suggestions From Top Students',
          deepDiveSections: [
            {
              title: 'Time-Boxing vs. Endless To-Do Lists',
              desc: 'A standard to-do list is dangerous because it has no boundaries. If you write "Study Biology" on a list, it can take two hours or drag on for ten hours because there is no deadline. Time-boxing fixes this by giving every task a concrete start and end time (for example, 2:00 PM to 3:30 PM). Parkinson’s Law states that work expands to fill the time available for its completion. By setting a strict 90-minute time box, you naturally work with higher urgency and eliminate daydreaming.'
            },
            {
              title: 'The Power of Routine Templates for Exam Prep',
              desc: 'During high-stakes exam periods, consistency is everything. Use StudyLawn’s template feature to create a dedicated "Exam Mode" routine with three 90-minute focus blocks, dedicated meal times, and an evening review period. Having a predictable rhythm calms exam anxiety because you know that if you just follow the schedule, all necessary topics will be thoroughly revised.'
            },
            {
              title: 'How to Recover When Your Schedule Gets Derailed',
              desc: 'Every student has days where an emergency, headache, or unexpected errand destroys the morning plan. When this happens, do not throw away the whole day in frustration. Simply open your Planner, delete or adjust the missed morning slots, and recommit to finishing the afternoon blocks. Saving half a study day is infinitely better than giving up on the entire day.'
            }
          ],
          faqTitle: 'Frequently Asked Questions About the Study Planner',
          faqs: [
            {
              question: 'Do I need to sign up or create an account to use the timetable?',
              answer:
                'No sign-up is needed at all. You can build your timetable, create recurring templates, and manage your schedule without ever creating an account or logging in. Everything is stored locally on your device in your browser.'
            },
            {
              question: 'How do I save a timetable layout so I do not have to recreate it every day?',
              answer:
                'Set up your slots for the day, then click the "Save Routine" button in the timetable header. Name your template (e.g. "Weekday College Routine"). Anytime you want to use it again, click "Templates" and select your saved routine to load it instantly.'
            },
            {
              question: 'Can I plan schedules for future days like tomorrow or next week?',
              answer:
                'Yes. Use the date selector pills (Today, Tomorrow) or the date picker in the header to switch to any future date. You can map out your entire upcoming week in advance.'
            },
            {
              question: 'What does the Auto-Fill Tasks button do?',
              answer:
                'Auto-Fill looks at your uncompleted items in the Tasks tab, prioritizes the High and Medium priority items, and automatically creates or populates study slots for the day based on their estimated study times.'
            },
            {
              question: 'Can I change the time format to 24-hour military time?',
              answer:
                'Yes. Go to Settings (gear icon in the sidebar) and toggle the Time Format between 12-hour (AM/PM) and 24-hour mode according to your preference.'
            }
          ]
        };

      case 'completion':
        return {
          badge: 'StudyLawn Field Guide • Tasks & Objectives Planner',
          title: 'Study Tasks & Objectives: Breaking Down Syllabuses and Conquering Your Queue',
          subtitle:
            'How to turn massive textbooks and intimidating exam syllabuses into clear, bite-sized tasks you can check off every day.',
          intro:
            'Every student knows the feeling of staring at a 600-page syllabus or a stack of textbooks and feeling completely paralyzed. When your goals are too big and vague, your brain does not know where to begin, so it chooses the path of least resistance: procrastination. The StudyLawn Tasks tab is your personal task engine designed to turn overwhelming coursework into clear, actionable, bite-sized steps. You can categorize tasks by subject, set estimated completion times, assign priority tags, and schedule them directly into your daily timetable. And just like the rest of StudyLawn, no sign-up is needed. There are no accounts, no subscriptions, and no tracking—just a clean, lightning-fast workspace that works completely offline.',
          philosophyTitle: 'The StudyLawn Motto: Small Steps, Big Victories',
          philosophyText: [
            'Our task philosophy centers on one core insight: "You cannot study a whole subject at once; you can only solve one problem, read one page, and revise one concept at a time." When students write vague to-do items like "Study Physics" or "Prepare for History Exam," they are setting themselves up for failure. A vague task creates friction and hesitation. But when you break that goal down into "Physics: Solve 12 projectile motion problems" or "History: Summarize Chapter 4 key dates," the task becomes finite, manageable, and approachable.',
            'By estimating how many minutes each task will take and prioritizing items into High, Medium, and Low tiers, you gain total control over your workload. You stop guessing what to do next and start experiencing the daily satisfaction of checking off real objectives one after another.'
          ],
          howItWorksIntro: 'Step-by-Step Suggestions: How to Manage Your Study Tasks',
          howItWorksSteps: [
            {
              title: '1. Write Specific, Micro-Scoped Task Titles',
              desc: 'Never write a generic task like "Chemistry." Instead, write an actionable phrase like "Chemistry: Memorize periodic table group 1 trends and do 5 quiz questions." Giving your task a clear boundary makes it 10x easier to start without hesitation.'
            },
            {
              title: '2. Assign Realistic Estimated Durations',
              desc: 'When adding a task, enter an estimated duration (such as 30m, 45m, or 1h 30m). The task board automatically calculates your total pending workload at the top of the screen, warning you if you have accidentally assigned yourself 14 hours of work for a single day.'
            },
            {
              title: '3. Set Meaningful Priority Levels (High, Medium, Low)',
              desc: 'Mark urgent homework and high-stakes exam topics as High priority. Mark supplementary reading or optional review as Low priority. This allows you to filter and focus on what truly moves the needle each day.'
            },
            {
              title: '4. Schedule Tasks Into Timetable Slots With One Click',
              desc: 'Hover over any pending task and click the calendar icon to schedule it directly into your daily timetable. This assigns the task a specific time block so it is locked into your schedule for the day.'
            },
            {
              title: '5. Launch a Timer Session Directly From a Task',
              desc: 'Ready to work on an assignment right now? Click the play icon on any task card to jump straight into your focus timer with that task pre-loaded and ready for immediate deep work.'
            },
            {
              title: '6. Check Off Completed Tasks and Track Progress',
              desc: 'When you finish an assignment, click the checkmark. Enjoy the visual progress bar updating across your task board. Completed tasks can be kept for reference or cleared away whenever you want a clean slate.'
            },
            {
              title: '7. Filter by Subject, Today, Tomorrow, and Upcoming',
              desc: 'Use the top filter tabs to view only the tasks relevant to your current study session. Filter by specific subjects when you want to focus exclusively on Mathematics or Biology without distractions.'
            }
          ],
          keyTipsTitle: 'The Four Rules of High-Impact Task Management',
          keyTips: [
            {
              title: 'The Rule of Three',
              desc: 'Before starting your study day, choose your Top 3 High-Priority tasks. Commit to finishing these three items no matter what. If you finish them, your day is an undeniable success.'
            },
            {
              title: 'Respect Your Workload Cap',
              desc: 'Check the total estimated hours badge at the top right of the task board. If your pending tasks add up to 10 hours on a school day, be realistic and push lower-priority items to tomorrow.'
            },
            {
              title: 'Keep Verbs in Every Task Title',
              desc: 'Always start task titles with an action verb: "Solve", "Read", "Write", "Derive", "Summarize". Action verbs instruct your brain exactly what physical action to take when you sit down.'
            },
            {
              title: 'Zero Sign-Up, Instant Offline Access',
              desc: 'No sign-up is needed. Your task lists and syllabus objectives are stored locally on your device with complete privacy. You can manage your tasks anywhere, even without Wi-Fi.'
            }
          ],
          workflowTitle: 'How Tasks Fuel Your Whole Study Ecosystem',
          workflowText: [
            'Your Tasks tab acts as the engine room of StudyLawn. The assignments you create here feed directly into the Overview Task Board, allowing you to check them off while running your study timer. They also sync directly with the Timetable maker through the Auto-Fill feature, ensuring your schedule is always populated with meaningful work.',
            'Whenever a task involves creating a revision summary, memorizing formulas, or reviewing an exam, link that task to a note in your Vault. This creates a closed-loop study system where tasks drive action, timers track focus, and the vault preserves your knowledge.'
          ],
          deepDiveTitle: 'Practical Task Strategies From the Real World',
          deepDiveSections: [
            {
              title: 'Overcoming the "Wall of Awful" on Difficult Assignments',
              desc: 'When an assignment feels daunting, students often build an emotional "wall of awful" around it—feeling anxious, guilty, and overwhelmed before even opening the file. The antidote is radical micro-scoping. Break the terrifying task into ridiculously small steps. Instead of "Write 2,000 word term paper," make your task "Write rough 3-bullet outline." Once you check off that tiny task, the emotional barrier drops and momentum takes over.'
            },
            {
              title: 'The Power of Closing Open Mental Loops',
              desc: 'When you have twelve unfinished assignments floating around in your head, your brain experiences constant background stress. Writing every single task down in StudyLawn gets the chaos out of your head and onto the screen. Once a task is safely captured with a due date and priority, your mind can finally relax and focus 100% on the single problem in front of you.'
            },
            {
              title: 'Batching Small Chores vs. Deep Work Blocks',
              desc: 'Group quick administrative tasks—like printing a lab sheet, sending an email to a professor, or downloading lecture slides—into a single 20-minute batch at the end of the day. Never interrupt a deep mathematical derivation or reading session to do a five-minute chore.'
            }
          ],
          faqTitle: 'Frequently Asked Questions About Study Tasks',
          faqs: [
            {
              question: 'Do I need an account or sign-up to save my study tasks?',
              answer:
                'No sign-up is required. You can add as many tasks, subjects, and deadlines as you want. All task data is stored securely in your browser’s local storage on your own device.'
            },
            {
              question: 'How do I add a task to my daily timetable schedule?',
              answer:
                'Click the calendar icon on any task card, or open the Timetable tab and select the task from the "Assigned Task" dropdown menu when creating or editing a study slot.'
            },
            {
              question: 'Can I filter tasks so I only see what is due today?',
              answer:
                'Yes. Use the date filters (Today, Tomorrow, Upcoming, or All) at the top of the Tasks tab to quickly focus on what needs to be completed right now.'
            },
            {
              question: 'What happens to tasks once I mark them completed?',
              answer:
                'Completed tasks are visually struck through and counted toward your completed workload. You can keep them visible to celebrate your daily progress, or use the clear button to archive them.'
            },
            {
              question: 'Can I categorize tasks by school subject or course code?',
              answer:
                'Yes. You can assign any custom subject name (such as "Math", "Biology", or "CS101") to your tasks. You can then filter the entire list by subject to focus on one class at a time.'
            }
          ]
        };

      case 'tests':
        return {
          badge: 'StudyLawn Field Guide • Knowledge Vault & Notes',
          title: 'The Study Vault: Notes, Mistake Journals, and High-Yield Revision',
          subtitle:
            'How to organize subject folders, master your exam mistakes, and build a high-yield knowledge vault for long-term retention.',
          intro:
            'Taking notes is easy, but organizing them so they actually help you score higher on exams is where most students struggle. Notes end up scattered across paper notebooks, cloud documents, phone photo rolls, and random browser bookmarks. When exam week arrives, you waste hours searching for that one formula or lecture summary. The StudyLawn Vault is your personal, distraction-free knowledge archive. Organize your notes into clean subject folders, upload textbook diagrams and scans, keep high-yield formula sheets, and maintain a dedicated Mistake Journal for test autopsies. Best of all, no sign-up is needed. Your notes and files live locally on your device with complete privacy and instant offline access.',
          philosophyTitle: 'The StudyLawn Motto: Learn From Your Mistakes',
          philosophyText: [
            'Our vault philosophy is centered on an undeniable truth: "Re-reading notes you already know feels good, but reviewing the questions you got wrong is what actually raises your grades." Most students spend 90% of their revision time passively highlighting textbook chapters they already understand because it feels comfortable and effortless. But real academic growth happens at the boundary of your mistakes.',
            'The Vault is designed to be an active learning hub, not a dusty digital file cabinet. When you create dedicated folders for each subject, write concise summary notes in your own words, and log every exam error in your Mistake Journal, you transform passive studying into active mastery. You build a personal library of insights that sharpens with every test you take.'
          ],
          howItWorksIntro: 'Step-by-Step Suggestions: How to Build Your Knowledge Vault',
          howItWorksSteps: [
            {
              title: '1. Create Clean Subject Folders',
              desc: 'Click "New Folder" at the top of the Vault page. Create dedicated folders for each of your classes or exam subjects (such as "Mathematics", "Biology", "Physics", or "World History"). Nest sub-folders for specific units or chapters to keep your archive tidy.'
            },
            {
              title: '2. Create Fast, Formatted Study Notes',
              desc: 'Click "New Note" to open the distraction-free markdown text editor. Write definitions, key proofs, essay outlines, and lecture summaries. Use bold text, bullet points, and code blocks to make your notes easy to scan before exams.'
            },
            {
              title: '3. Build a Dedicated "Mistake Journal" for Every Test',
              desc: 'Whenever you get back a graded test, quiz, or mock exam, create a note titled "Exam Autopsy / Mistake Log". Write down the exact questions you got wrong, why you got them wrong (concept gap, careless math, or misread question), and the correct step-by-step solution.'
            },
            {
              title: '4. Upload Textbook Scans and Visual Diagrams',
              desc: 'Click "Upload File" to add diagrams, handwritten math solutions, or textbook figures. StudyLawn provides instant full-screen visual previews with zoom and pan controls so you can inspect anatomical diagrams or circuit schematics in high resolution.'
            },
            {
              title: '5. Keep One-Page High-Yield Formula Sheets',
              desc: 'In each subject folder, maintain a single note titled "Formula Sheet & Key Definitions". Keep this note concise and restricted to formulas, constants, and tricky definitions so you can review it in five minutes right before entering the exam hall.'
            },
            {
              title: '6. Use Instant Live Search to Find Notes in Seconds',
              desc: 'Use the search bar at the top of the Vault to instantly filter through all your folders, documents, and notes. Locate any formula, definition, or summary in seconds without clicking through nested directories.'
            },
            {
              title: '7. Export Regular Backups From Settings',
              desc: 'Because StudyLawn stores your notes locally in your browser for total privacy, go to Settings once a week and click "Export Backup" to save a local JSON copy of your entire vault to your hard drive or USB drive.'
            }
          ],
          keyTipsTitle: 'The Four Pillars of an Effective Study Vault',
          keyTips: [
            {
              title: 'Pillar I: The Mistake Journal',
              desc: 'Every error on a practice exam is a golden opportunity. Logging what went wrong and how to fix it guarantees you will never lose marks on that exact question type again.'
            },
            {
              title: 'Pillar II: The Feynman Technique',
              desc: 'Write your notes in plain, everyday language as if explaining the concept to a twelve-year-old. If you cannot explain it simply, you do not truly understand it yet.'
            },
            {
              title: 'Pillar III: Dual Coding (Words + Visuals)',
              desc: 'Pair written notes with uploaded diagrams or flowcharts. Combining visual imagery with text creates multiple mental pathways for remembering complex systems.'
            },
            {
              title: 'Pillar IV: Zero Sign-Up & Total Privacy',
              desc: 'No sign-up is needed. Your personal notes, test reflections, and study materials stay 100% on your device, completely shielded from cloud servers and third-party trackers.'
            }
          ],
          workflowTitle: 'How the Vault Connects With Your Whole Study Routine',
          workflowText: [
            'The Vault is the intellectual reservoir of your StudyLawn workspace. While running a focus session on the Overview timer, you can keep the Vault open in another tab or side window to quickly check your formula sheet or consult your summary notes without browsing distracting websites.',
            'Furthermore, when planning your weekly schedule in the Planner, allocate dedicated time blocks specifically for "Vault Review & Mistake Journaling". Regularly revisiting your error logs turns temporary memorization into permanent, long-term mastery.'
          ],
          deepDiveTitle: 'Practical Learning Strategies You Can Apply Today',
          deepDiveSections: [
            {
              title: 'The Exam Autopsy: How Top Students Learn From Failure',
              desc: 'When average students receive a disappointing test score, they look at the grade, feel discouraged, and stuff the paper into the bottom of their backpack. Top students do the exact opposite: they perform an "exam autopsy." Categorize every lost point into one of three buckets: 1) Careless Mistake (you knew how to do it, but made a silly calculation error), 2) Memory Slip (you forgot a formula or date you should have memorized), or 3) Conceptual Gap (you genuinely did not understand how to solve the problem). Fixing careless mistakes requires slowing down and checking units; fixing memory slips requires better formula sheets; fixing concept gaps requires asking a teacher or watching a walkthrough. This targeted approach fixes your weaknesses fast.'
            },
            {
              title: 'Active Recall vs. Passive Highlighting',
              desc: 'Highlighting a textbook gives you the pleasant illusion of learning, but research from memory specialists proves that passive reading has almost zero impact on long-term test performance. Instead, use your Vault notes for active recall: close the note, ask yourself the core question, and try to write the answer on a blank piece of paper from memory. Only open the note to verify your work. That mental strain is where real learning happens.'
            },
            {
              title: 'The Power of One-Page Cheat Sheets',
              desc: 'Force yourself to summarize an entire chapter onto a single digital note in your Vault. The constraint of fitting everything onto one page forces you to separate critical principles from useless trivia. The very act of deciding what to include and what to leave out organizes the material in your mind far better than copying pages verbatim.'
            }
          ],
          faqTitle: 'Frequently Asked Questions About the Study Vault',
          faqs: [
            {
              question: 'Do I need an account or sign-up to store my notes in the Vault?',
              answer:
                'No sign-up is needed whatsoever. You can create unlimited folders, write rich notes, and upload diagrams without ever creating a profile or logging in. Everything is stored directly in your browser’s IndexedDB database on your computer.'
            },
            {
              question: 'Can I use the Vault completely offline without an internet connection?',
              answer:
                'Yes. Because StudyLawn runs locally in your browser, your folders, text notes, and uploaded diagrams are accessible even on an airplane, in an offline basement library, or during a Wi-Fi outage.'
            },
            {
              question: 'What kinds of files can I upload to my subject folders?',
              answer:
                'You can upload images (PNG, JPG, WEBP), diagrams, scanned notebook pages, and text documents. StudyLawn generates instant visual previews and allows full-screen zooming.'
            },
            {
              question: 'How do I search for a specific formula or note?',
              answer:
                'Simply type your query into the search bar at the top of the Vault. The list will instantly filter to show matching folders, notes, and documents across your archive.'
            },
            {
              question: 'How can I back up my notes or move them to a new computer?',
              answer:
                'Head over to Settings (gear icon in the sidebar) and click "Export Backup". This downloads a single JSON backup file containing all your notes, folders, and study data. On your new device, simply click "Import Backup" to restore everything in seconds.'
            }
          ]
        };

      default:
        return {
          badge: 'StudyLawn Field Guide',
          title: 'StudyLawn System Guide',
          subtitle: 'A clean, private workspace engineered for focused students.',
          intro: 'StudyLawn is your private, distraction-free study environment.',
          philosophyTitle: 'Our Philosophy',
          philosophyText: ['Quiet focus over loud ambition.'],
          howItWorksIntro: 'How to Use',
          howItWorksSteps: [],
          keyTipsTitle: 'Key Suggestions',
          keyTips: [],
          workflowTitle: 'Workflow',
          workflowText: [],
          deepDiveTitle: 'Practical Strategies',
          deepDiveSections: [],
          faqTitle: 'Frequently Asked Questions',
          faqs: []
        };
    }
  };

  const data = getArticleData();

  return (
    <section className="mt-14 pt-8 border-t border-[var(--border)] space-y-8 font-simple-html max-w-4xl mx-auto text-[var(--ink)]">
      {/* ─── Header & Mission ─── */}
      <div className="space-y-3 border-b border-[var(--border)] pb-5">
        <div className="text-xs uppercase tracking-widest text-[var(--accent)] font-bold font-mono">
          {data.badge}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] leading-snug">
          {data.title}
        </h2>
        <p className="text-base sm:text-lg text-[var(--ink)]/90 italic font-medium leading-relaxed">
          {data.subtitle}
        </p>
        <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed font-simple-html pt-1">
          {data.intro}
        </p>
      </div>

      {/* ─── The Philosophy & Motto ─── */}
      <div className="space-y-3 p-4 sm:p-5 bg-[var(--surface-subtle)] border border-[var(--border)]">
        <h3 className="text-lg font-bold text-[var(--ink)] tracking-tight">
          {data.philosophyTitle}
        </h3>
        {data.philosophyText.map((paragraph, idx) => (
          <p key={idx} className="text-sm sm:text-base text-[var(--ink)]/85 leading-relaxed font-simple-html">
            {paragraph}
          </p>
        ))}
      </div>

      {/* ─── Step-by-Step Practical Suggestions ─── */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[var(--ink)] tracking-tight border-b border-[var(--border)]/60 pb-2">
          {data.howItWorksIntro}
        </h3>
        <div className="space-y-3">
          {data.howItWorksSteps.map((step, idx) => (
            <div key={idx} className="p-3.5 bg-[var(--surface-subtle)]/70 border border-[var(--border)] space-y-1">
              <h4 className="text-sm sm:text-base font-bold text-[var(--ink)]">
                {step.title}
              </h4>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-simple-html">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Key Pillars & Principles ─── */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-[var(--ink)] tracking-tight border-b border-[var(--border)]/60 pb-2">
          {data.keyTipsTitle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {data.keyTips.map((tip, idx) => (
            <div key={idx} className="p-4 bg-[var(--surface-subtle)] border border-[var(--border)] space-y-1.5 flex flex-col justify-between">
              <h4 className="text-sm sm:text-base font-bold text-[var(--ink)]">{tip.title}</h4>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-simple-html">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Cross-Feature Workflow ─── */}
      <div className="space-y-3 p-4 sm:p-5 border-l-4 border-[var(--accent)] bg-[var(--surface-subtle)]">
        <h3 className="text-base sm:text-lg font-bold text-[var(--ink)]">
          {data.workflowTitle}
        </h3>
        {data.workflowText.map((para, idx) => (
          <p key={idx} className="text-sm sm:text-base text-[var(--muted)] leading-relaxed font-simple-html">
            {para}
          </p>
        ))}
      </div>

      {/* ─── Real-World Strategies ─── */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[var(--ink)] tracking-tight border-b border-[var(--border)]/60 pb-2">
          {data.deepDiveTitle}
        </h3>
        <div className="space-y-3">
          {data.deepDiveSections.map((sec, idx) => (
            <div key={idx} className="space-y-1.5 p-3.5 bg-[var(--surface-subtle)]/40 border border-[var(--border)]">
              <h4 className="text-base font-bold text-[var(--ink)]">
                {sec.title}
              </h4>
              <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed font-simple-html">
                {sec.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Frequently Asked Questions (FAQ) ─── */}
      <div className="space-y-4 pt-4 border-t border-[var(--border)]">
        <h3 className="text-lg font-bold text-[var(--ink)] tracking-tight">
          {data.faqTitle}
        </h3>
        <div className="space-y-3.5">
          {data.faqs.map((faq, idx) => (
            <div key={idx} className="space-y-1 p-3.5 bg-[var(--surface-subtle)] border border-[var(--border)]">
              <div className="text-sm sm:text-base font-bold text-[var(--ink)] flex items-start gap-2">
                <span className="text-[var(--accent)] font-mono font-bold">Q:</span>
                <span>{faq.question}</span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed pl-5 font-simple-html pt-1">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
