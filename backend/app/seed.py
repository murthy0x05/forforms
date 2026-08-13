"""Seed the database with sample forms, questions, and responses."""
import uuid
from datetime import datetime, timezone, timedelta
from app.database import SessionLocal
from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.models.answer import Answer


def seed_database():
    """Populate the database with sample data."""
    db = SessionLocal()

    # Check if data already exists
    existing = db.query(Form).first()
    if existing:
        print("Database already seeded. Skipping.")
        db.close()
        return

    print("Seeding database...")

    now = datetime.now(timezone.utc)

    # ========== FORM 1: Customer Feedback Survey (Published, 5 responses) ==========
    form1_id = str(uuid.uuid4())
    form1 = Form(
        id=form1_id,
        title="Customer Feedback Survey",
        description="Help us improve by sharing your experience",
        status="published",
        share_id="feedback1",
        welcome_screen_title="We'd love your feedback! 💬",
        welcome_screen_description="This survey takes about 2 minutes. Your responses help us improve our service.",
        welcome_screen_enabled="true",
        thankyou_screen_title="Thank you for your feedback! 🎉",
        thankyou_screen_description="Your input is invaluable. We'll use it to make our service even better.",
        theme_settings={"primaryColor": "#6C5CE7", "backgroundColor": "#FFFFFF", "fontFamily": "Inter"},
        created_at=now - timedelta(days=7),
        updated_at=now - timedelta(hours=2),
    )
    db.add(form1)

    # Form 1 Questions
    q1_1_id = str(uuid.uuid4())
    q1_2_id = str(uuid.uuid4())
    q1_3_id = str(uuid.uuid4())
    q1_4_id = str(uuid.uuid4())
    q1_5_id = str(uuid.uuid4())

    questions_f1 = [
        Question(id=q1_1_id, form_id=form1_id, type="rating", title="How satisfied are you with our service?",
                 description="1 = Very dissatisfied, 5 = Very satisfied", order_index=0, is_required=True,
                 properties={"max_rating": 5, "shape": "star"}, created_at=now - timedelta(days=7), updated_at=now - timedelta(days=7)),
        Question(id=q1_2_id, form_id=form1_id, type="multiple_choice", title="How did you hear about us?",
                 order_index=1, is_required=True,
                 properties={"choices": ["Social Media", "Friend or Colleague", "Online Ad", "Search Engine", "Other"], "allow_multiple": False},
                 created_at=now - timedelta(days=7), updated_at=now - timedelta(days=7)),
        Question(id=q1_3_id, form_id=form1_id, type="long_text", title="What can we improve?",
                 description="We genuinely want to know — be as specific as you'd like!", order_index=2, is_required=False,
                 properties={"placeholder": "Share your thoughts...", "max_length": 1000},
                 created_at=now - timedelta(days=7), updated_at=now - timedelta(days=7)),
        Question(id=q1_4_id, form_id=form1_id, type="yes_no", title="Would you recommend us to a friend?",
                 order_index=3, is_required=True, properties={},
                 created_at=now - timedelta(days=7), updated_at=now - timedelta(days=7)),
        Question(id=q1_5_id, form_id=form1_id, type="email", title="Your email (optional)",
                 description="Only if you'd like us to follow up with you", order_index=4, is_required=False,
                 properties={"placeholder": "name@example.com"},
                 created_at=now - timedelta(days=7), updated_at=now - timedelta(days=7)),
    ]
    db.add_all(questions_f1)

    # Form 1 Responses
    feedback_data = [
        {"rating": "5", "source": "Social Media", "improve": "Everything is great! Maybe add a mobile app.", "recommend": "Yes", "email": "alice@example.com"},
        {"rating": "4", "source": "Friend or Colleague", "improve": "Faster shipping would be nice.", "recommend": "Yes", "email": "bob@example.com"},
        {"rating": "3", "source": "Search Engine", "improve": "The checkout process is a bit confusing. Also, more payment options would help.", "recommend": "No", "email": ""},
        {"rating": "5", "source": "Social Media", "improve": "", "recommend": "Yes", "email": "diana@example.com"},
        {"rating": "4", "source": "Online Ad", "improve": "Better customer support hours would be appreciated.", "recommend": "Yes", "email": ""},
    ]

    for i, data in enumerate(feedback_data):
        resp_id = str(uuid.uuid4())
        resp = Response(id=resp_id, form_id=form1_id, submitted_at=now - timedelta(days=6 - i, hours=i * 3), metadata_={})
        db.add(resp)
        db.flush()
        answers = [
            Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q1_1_id, value=data["rating"]),
            Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q1_2_id, value=data["source"]),
            Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q1_3_id, value=data["improve"]),
            Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q1_4_id, value=data["recommend"]),
            Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q1_5_id, value=data["email"]),
        ]
        db.add_all(answers)

    # ========== FORM 2: Job Application Form (Published, 3 responses) ==========
    form2_id = str(uuid.uuid4())
    form2 = Form(
        id=form2_id,
        title="Job Application Form",
        description="Apply to join our amazing team",
        status="published",
        share_id="jobapp22",
        welcome_screen_title="Join Our Team! 🚀",
        welcome_screen_description="We're excited you're interested in working with us. This application takes about 5 minutes.",
        welcome_screen_enabled="true",
        thankyou_screen_title="Application Received! ✅",
        thankyou_screen_description="Thank you for applying. We'll review your application and get back to you within 5 business days.",
        theme_settings={"primaryColor": "#00B894", "backgroundColor": "#FFFFFF", "fontFamily": "Inter"},
        created_at=now - timedelta(days=14),
        updated_at=now - timedelta(days=1),
    )
    db.add(form2)

    q2_1_id = str(uuid.uuid4())
    q2_2_id = str(uuid.uuid4())
    q2_3_id = str(uuid.uuid4())
    q2_4_id = str(uuid.uuid4())
    q2_5_id = str(uuid.uuid4())
    q2_6_id = str(uuid.uuid4())

    questions_f2 = [
        Question(id=q2_1_id, form_id=form2_id, type="short_text", title="What's your full name?",
                 order_index=0, is_required=True, properties={"placeholder": "Enter your full name"},
                 created_at=now - timedelta(days=14), updated_at=now - timedelta(days=14)),
        Question(id=q2_2_id, form_id=form2_id, type="email", title="Email address",
                 description="We'll use this to contact you about your application", order_index=1, is_required=True,
                 properties={"placeholder": "you@example.com"},
                 created_at=now - timedelta(days=14), updated_at=now - timedelta(days=14)),
        Question(id=q2_3_id, form_id=form2_id, type="number", title="Years of professional experience",
                 order_index=2, is_required=True, properties={"placeholder": "0", "min_value": 0, "max_value": 50},
                 created_at=now - timedelta(days=14), updated_at=now - timedelta(days=14)),
        Question(id=q2_4_id, form_id=form2_id, type="dropdown", title="Preferred role",
                 order_index=3, is_required=True,
                 properties={"choices": ["Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer", "UI/UX Designer"]},
                 created_at=now - timedelta(days=14), updated_at=now - timedelta(days=14)),
        Question(id=q2_5_id, form_id=form2_id, type="long_text", title="Tell us about yourself",
                 description="What makes you a great fit for this role?", order_index=4, is_required=False,
                 properties={"placeholder": "Share your story...", "max_length": 2000},
                 created_at=now - timedelta(days=14), updated_at=now - timedelta(days=14)),
        Question(id=q2_6_id, form_id=form2_id, type="multiple_choice", title="When can you start?",
                 order_index=5, is_required=True,
                 properties={"choices": ["Immediately", "In 2 weeks", "In 1 month", "In 3 months"], "allow_multiple": False},
                 created_at=now - timedelta(days=14), updated_at=now - timedelta(days=14)),
    ]
    db.add_all(questions_f2)

    # Form 2 Responses
    applicant_data = [
        {"name": "Sarah Johnson", "email": "sarah.j@email.com", "experience": "5", "role": "Frontend Developer", "about": "Passionate frontend developer with 5 years of experience in React, TypeScript, and modern CSS. I love creating beautiful, accessible user interfaces.", "start": "In 2 weeks"},
        {"name": "Michael Chen", "email": "m.chen@email.com", "experience": "8", "role": "Full Stack Developer", "about": "Full-stack engineer experienced in Node.js, Python, and cloud architecture. Led a team of 6 at my previous company.", "start": "In 1 month"},
        {"name": "Priya Patel", "email": "priya.p@email.com", "experience": "2", "role": "UI/UX Designer", "about": "Recent design school graduate with a strong portfolio in mobile-first design. Proficient in Figma and prototyping tools.", "start": "Immediately"},
    ]

    for i, data in enumerate(applicant_data):
        resp_id = str(uuid.uuid4())
        resp = Response(id=resp_id, form_id=form2_id, submitted_at=now - timedelta(days=10 - i * 3, hours=i * 5), metadata_={})
        db.add(resp)
        db.flush()
        answers = [
            Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q2_1_id, value=data["name"]),
            Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q2_2_id, value=data["email"]),
            Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q2_3_id, value=data["experience"]),
            Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q2_4_id, value=data["role"]),
            Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q2_5_id, value=data["about"]),
            Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q2_6_id, value=data["start"]),
        ]
        db.add_all(answers)

    # ========== FORM 3: Event Registration (Draft, no responses) ==========
    form3_id = str(uuid.uuid4())
    form3 = Form(
        id=form3_id,
        title="Tech Conference Registration",
        description="Register for the annual tech conference 2025",
        status="draft",
        share_id=None,
        welcome_screen_title="Welcome to TechConf 2025! 🎪",
        welcome_screen_description="Register now to secure your spot at the biggest tech event of the year.",
        welcome_screen_enabled="true",
        thankyou_screen_title="You're Registered! 🎫",
        thankyou_screen_description="See you at the conference! Check your email for confirmation details.",
        theme_settings={"primaryColor": "#E17055", "backgroundColor": "#FAFAFA", "fontFamily": "Inter"},
        created_at=now - timedelta(days=2),
        updated_at=now - timedelta(hours=5),
    )
    db.add(form3)

    questions_f3 = [
        Question(id=str(uuid.uuid4()), form_id=form3_id, type="short_text", title="Your name",
                 order_index=0, is_required=True, properties={"placeholder": "Enter your full name"},
                 created_at=now - timedelta(days=2), updated_at=now - timedelta(days=2)),
        Question(id=str(uuid.uuid4()), form_id=form3_id, type="email", title="Email address",
                 order_index=1, is_required=True, properties={"placeholder": "you@example.com"},
                 created_at=now - timedelta(days=2), updated_at=now - timedelta(days=2)),
        Question(id=str(uuid.uuid4()), form_id=form3_id, type="dropdown", title="T-shirt size",
                 order_index=2, is_required=True,
                 properties={"choices": ["XS", "S", "M", "L", "XL", "XXL"]},
                 created_at=now - timedelta(days=2), updated_at=now - timedelta(days=2)),
        Question(id=str(uuid.uuid4()), form_id=form3_id, type="yes_no", title="Any dietary restrictions?",
                 description="Let us know so we can accommodate your needs at the event", order_index=3, is_required=False,
                 properties={},
                 created_at=now - timedelta(days=2), updated_at=now - timedelta(days=2)),
    ]
    db.add_all(questions_f3)

    db.commit()
    db.close()
    print("Database seeded successfully with 3 forms, 15 questions, and 8 responses.")
