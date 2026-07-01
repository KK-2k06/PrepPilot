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
    
    raw_search_data = {}
    mcp_url = f"https://mcp.tavily.com/mcp/?tavilyApiKey={tavily_key}"
    
    # Connect to the remote Tavily MCP server via SSE
    try:
        async with sse_client(mcp_url) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                # Fetch resources for each topic using the MCP tool
                for topic in topics:
                    try:
                        result = await session.call_tool(
                            "tavily_search", 
                            {"query": f"{topic} tutorial clear explanation", "max_results": 4}
                        )
                        if result.content and len(result.content) > 0:
                            search_results_text = result.content[0].text
                            raw_search_data[topic] = json.loads(search_results_text)
                        else:
                            raw_search_data[topic] = []
                    except Exception as e:
                        raw_search_data[topic] = []
                        print(f"MCP Tavily search failed for {topic}: {e}")
    except Exception as e:
        print(f"Failed to connect to MCP server: {e}")
        return []
            
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
