# AWS deployment (resume-ready subset)

Use 6–7 services well rather than listing everything.

| Service | Role in DevFlow |
| --- | --- |
| S3 | Host the React SPA build |
| CloudFront | HTTPS CDN in front of S3 + API origin |
| ECS Fargate (or EC2) | Run the Node API container |
| IAM | Least-privilege task roles |
| Secrets Manager | JWT secrets, GitHub OAuth, OpenAI key |
| CloudWatch | Logs, CPU/memory, API latency, alarms |
| Application Load Balancer | Route `/api` to ECS |

Suggested flow:

1. GitHub Actions builds and tests.
2. Image is pushed to ECR.
3. ECS service rolls out a new task.
4. CloudWatch metrics are shown on the Monitoring tab (live when `AWS_REGION` credentials are present; seeded demo metrics otherwise).

Local development does not require AWS. `docker compose up -d` is enough for MongoDB + Redis.
