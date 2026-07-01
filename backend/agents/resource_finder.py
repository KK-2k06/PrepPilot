import os
import json
import asyncio
from google import genai
from google.genai import types
from mcp import ClientSession, StdioServerParameters
from mcp.client.sse import sse_client

async def find_resources(topics: list) -> list:
    """
    Given a list of weak topics, uses the Tavily MCP Server to find live resources
    and Gemini to curate/format them into a study plan.
    """
    if not topics:
        return []

    tavily_key = os.environ.get("TAVILY_API_KEY", "")
    if not tavily_key or tavily_key == "tvly-your-key-here":
        raise ValueError("TAVILY_API_KEY not configured properly.")
        
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if not gemini_key:
        raise ValueError("GEMINI_API_KEY not configured.")
        
    client = genai.Client(api_key=gemini_key)
    
    import json
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    
    raw_search_data = {}
    
    # We define an async function to handle the MCP connection per topic
    async def fetch_mcp(t):
        import sys
        server_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tavily_mcp.py")
        server_params = StdioServerParameters(
            command=sys.executable,
            args=[server_path],
            env=os.environ.copy()
        )
        try:
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    
                    # Fetch Articles
                    result_article = await session.call_tool(
                        "tavily_search", 
                        {"query": f"{t} clear explanation article guide", "max_results": 2}
                    )
                    # Fetch Videos
                    result_video = await session.call_tool(
                        "tavily_search", 
                        {"query": f"{t} tutorial youtube video", "max_results": 2}
                    )
                    
                    merged = []
                    if result_article.content and len(result_article.content) > 0:
                        merged.extend(json.loads(result_article.content[0].text))
                    if result_video.content and len(result_video.content) > 0:
                        merged.extend(json.loads(result_video.content[0].text))
                        
                    return merged
        except Exception as e:
            print(f"MCP Tavily search failed for {t}: {e}")
            return []

    # Fetch resources for each topic using the Local MCP Server
    for topic in topics:
        raw_search_data[topic] = await fetch_mcp(topic)
            
    prompt = f"""
    You are an expert tutor. I am providing you with a list of topics a student struggled with, along with live web search results for those topics.
    
    For each topic, provide a brief, encouraging explanation of "why this matters" for their overall understanding.
    Then, select the best 2-3 links from the provided search results to recommend to the student. Try to determine if a link is a video or article based on the URL (e.g. youtube.com is a video).
    
    Data:
    {json.dumps(raw_search_data, indent=2)}
    
    Output ONLY a valid JSON array of objects with this exact structure:
    [
      {{
        "topic": "Topic Name",
        "why_it_matters": "A 1-2 sentence explanation of why this concept is important.",
        "resources": [
          {{
            "type": "video", // or "article"
            "title": "Title of the resource",
            "url": "https://..."
          }}
        ]
      }}
    ]
    """
    
    # Use Gemini to curate the MCP results
    try:
        # We run the synchronous Gemini call in a thread pool so it doesn't block the async event loop
        response = await asyncio.to_thread(
            client.models.generate_content,
            model='gemini-3.1-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print("Failed to parse Gemini output:", e)
        return []
