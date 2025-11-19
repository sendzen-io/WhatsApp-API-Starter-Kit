export type CodeGenerator = (url: string, body: any, token: string, apiEndpoint?: 'sendzen' | 'facebook') => string;

export const generateJavaScriptCode = (url: string, body: any, token: string, apiEndpoint: 'sendzen' | 'facebook' = 'sendzen'): string => {
  const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
  return `// ${apiName} Integration - JavaScript (Node.js)
const axios = require('axios');

const sendMessage = async () => {
  try {
    const response = await axios.post('${url}', ${JSON.stringify(body, null, 4)}, {
      headers: {
        'Authorization': 'Bearer ${token}',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    throw error;
  }
};

// Call the function
sendMessage();`;
};

export const generatePythonCode = (url: string, body: any, token: string, apiEndpoint: 'sendzen' | 'facebook' = 'sendzen'): string => {
  const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
  return `# ${apiName} Integration - Python
import requests
import json

def send_message():
    url = '${url}'
    headers = {
        'Authorization': f'Bearer ${token}',
        'Content-Type': 'application/json'
    }
    data = ${JSON.stringify(body, null, 4)}
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        print('Message sent successfully:', response.json())
        return response.json()
    except requests.exceptions.RequestException as e:
        print('Error sending message:', e)
        if hasattr(e, 'response') and e.response is not None:
            print('Response:', e.response.text)
        raise

# Call the function
send_message()`;
};

export const generatePHPCode = (url: string, body: any, token: string, apiEndpoint: 'sendzen' | 'facebook' = 'sendzen'): string => {
  const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
  return `<?php
 // ${apiName} Integration - PHP
function sendMessage() {
    $url = '${url}';
    $data = ${JSON.stringify(body, null, 4)};
    
    $options = [
        'http' => [
            'header' => [
                "Authorization: Bearer ${token}",
                "Content-Type: application/json"
            ],
            'method' => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        throw new Exception('Error sending message');
    }
    
    $response = json_decode($result, true);
    echo "Message sent successfully: " . json_encode($response) . "\\n";
    return $response;
}

// Call the function
try {
    sendMessage();
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\\n";
}
?>`;
};

export const generateJavaCode = (url: string, body: any, token: string, apiEndpoint: 'sendzen' | 'facebook' = 'sendzen'): string => {
  const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
  return `// ${apiName} Integration - Java
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse.BodyHandlers;
import com.fasterxml.jackson.databind.ObjectMapper;

 public class ${apiEndpoint === 'sendzen' ? 'SendZenAPI' : 'FacebookGraphAPI'} {
    private static final String API_URL = "${url}";
    private static final String ACCESS_TOKEN = "${token}";
    
    public static void main(String[] args) {
        try {
            sendMessage();
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
    
    public static void sendMessage() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String requestBody = mapper.writeValueAsString(${JSON.stringify(body, null, 8)});
        
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_URL))
            .header("Authorization", "Bearer " + ACCESS_TOKEN)
            .header("Content-Type", "application/json")
            .POST(BodyPublishers.ofString(requestBody))
            .build();
            
        HttpResponse<String> response = client.send(request, BodyHandlers.ofString());
        
        if (response.statusCode() == 200) {
            System.out.println("Message sent successfully: " + response.body());
        } else {
            System.err.println("Error sending message: " + response.body());
        }
    }
}`;
};

export const generateCSharpCode = (url: string, body: any, token: string, apiEndpoint: 'sendzen' | 'facebook' = 'sendzen'): string => {
  const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
  return `// ${apiName} Integration - C# (.NET)
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

 public class ${apiEndpoint === 'sendzen' ? 'SendZenAPI' : 'FacebookGraphAPI'}
{
    private static readonly string ApiUrl = "${url}";
    private static readonly string AccessToken = "${token}";
    
    public static async Task Main(string[] args)
    {
        try
        {
            await SendMessageAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
    
    public static async Task SendMessageAsync()
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {AccessToken}");
        
        var requestBody = ${JSON.stringify(body, null, 8)};
        var json = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions { WriteIndented = true });
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        try
        {
            var response = await client.PostAsync(ApiUrl, content);
            var responseContent = await response.Content.ReadAsStringAsync();
            
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Message sent successfully: {responseContent}");
            }
            else
            {
                Console.WriteLine($"Error sending message: {responseContent}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}`;
};

export const generateRubyCode = (url: string, body: any, token: string, apiEndpoint: 'sendzen' | 'facebook' = 'sendzen'): string => {
  const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
  return `# ${apiName} Integration - Ruby
require 'net/http'
require 'json'
require 'uri'

def send_message
  uri = URI('${url}')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Post.new(uri)
  request['Authorization'] = 'Bearer ${token}'
  request['Content-Type'] = 'application/json'
  request.body = ${JSON.stringify(body, null, 2)}.to_json
  
  response = http.request(request)
  
  if response.code == '200'
    puts "Message sent successfully: #{response.body}"
  else
    puts "Error sending message: #{response.body}"
  end
  
  JSON.parse(response.body)
rescue => e
  puts "Error: #{e.message}"
end

# Call the function
send_message`;
};

export const generateGoCode = (url: string, body: any, token: string, apiEndpoint: 'sendzen' | 'facebook' = 'sendzen'): string => {
  const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
  return `// ${apiName} Integration - Go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func sendMessage() error {
    url := "${url}"
    token := "${token}"
    
    data := ${JSON.stringify(body, null, 4)}
    jsonData, err := json.Marshal(data)
    if err != nil {
        return fmt.Errorf("error marshaling data: %v", err)
    }
    
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    if err != nil {
        return fmt.Errorf("error creating request: %v", err)
    }
    
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return fmt.Errorf("error making request: %v", err)
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return fmt.Errorf("error reading response: %v", err)
    }
    
    if resp.StatusCode == http.StatusOK {
        fmt.Printf("Message sent successfully: %s\\n", string(body))
    } else {
        fmt.Printf("Error sending message: %s\\n", string(body))
    }
    
    return nil
}

func main() {
    if err := sendMessage(); err != nil {
        fmt.Printf("Error: %v\\n", err)
    }
}`;
};

export const generateCurlCode = (url: string, body: any, token: string, apiEndpoint: 'sendzen' | 'facebook' = 'sendzen'): string => {
  const apiName = apiEndpoint === 'sendzen' ? 'SendZen WhatsApp API' : 'Facebook Graph API';
  return `# ${apiName} Integration - cURL
curl -X POST '${url}' \\
  -H 'Authorization: Bearer ${token}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(body, null, 2).replace(/'/g, "'\\''")}'`;
};

export const getSyntaxLanguage = (lang: string): string => {
  if (lang === 'curl') return 'bash';
  if (lang === 'csharp') return 'csharp';
  return lang;
};

