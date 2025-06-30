import json
import boto3
import os

MODEL_ID = "anthropic.claude-v2:1"
REGION = "us-east-1"

bedrock = boto3.client(service_name="bedrock-runtime", region_name=REGION)

def lambda_handler(event, context):
    try:
        # Decode JSON body từ API Gateway HTTP API payload v2
        body = json.loads(event.get("body", "{}"))
        user_message = body.get("prompt", "Xin chào")

        system_prompt = (
            "Bạn là trợ lý AI cho hệ thống Lunova, chuyên hỗ trợ khách hàng xử lý các vấn đề liên quan đến đơn hàng, "
            "tài khoản và sản phẩm. Mọi phản hồi cần được trình bày ngắn gọn, thân thiện, chuyên nghiệp và sử dụng ngôn ngữ tự nhiên, "
            "đúng với ngữ cảnh câu hỏi của khách hàng. Nếu cần thông tin bổ sung, hãy hỏi lại một cách lịch sự. Trả lời ngắn gọn và đầy đủ thông tin."
        )

        payload = {
            "prompt": f"\n\nHuman: {system_prompt}\n\n{user_message}\n\nAssistant:",
            "max_tokens_to_sample": 1024,
            "temperature": 0.6,
            "top_p": 0.88,
            "top_k": 100,
            "stop_sequences": ["\nHuman:"]
        }

        response = bedrock.invoke_model(
            modelId=MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(payload)
        )

        result = json.loads(response['body'].read())
        reply = result.get('completion', '')

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',  # Hoặc localhost nếu cần giới hạn
                'Access-Control-Allow-Headers': '*'
            },
            'body': reply
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',  # Hoặc localhost nếu cần giới hạn
                'Access-Control-Allow-Headers': '*'
            },
            'body': error
        }