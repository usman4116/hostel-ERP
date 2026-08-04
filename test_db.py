import socket
import psycopg2

regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3",
    "ap-south-1", "ap-northeast-1", "ap-northeast-2",
    "ap-southeast-1", "ap-southeast-2", "sa-east-1", "ca-central-1"
]

project_ref = "yfewempcihihllxbvwpg"
password = "usman0411051122"
dbname = "postgres"
user = f"postgres.{project_ref}"

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    try:
        conn = psycopg2.connect(
            host=host,
            port=6543,
            dbname=dbname,
            user=user,
            password=password,
            connect_timeout=3
        )
        print(f"SUCCESS: {host}")
        conn.close()
        break
    except Exception as e:
        print(f"FAILED {host}: {e}")
