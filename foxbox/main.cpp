#include <foxbox/http.h>
#include <foxbox/socket.h>
#include <iostream>
#include <sstream>
#include <thread>
#include <mutex>
#include <map>

using namespace std;
using namespace Foxbox;


void server(int port, int id)
{
	TCP::Server server(port);
	
	while (true)
	{
		server.Listen();
		
	}
}

int main(int argc, char ** argv)
{

	chdir("..");
	int port = (argc == 2) ? atoi(argv[1]) : 8080;
	int count = 0;
	while (true)
	{
		TCP::Server server(port);
		server.Listen();
		while (server.Valid())
		{
			Debug("Connected; wait for request");
			HTTP::Request req;
			if (!req.Receive(server))
			{
				Debug("Invalid request!");
				server.Close();
				server.Listen();
				continue;
			}
			Debug("Got request! Path is: %s", req.Path().c_str());
		
			string & api = req.SplitPath().front();
			if (api == "cookies")
			{
				HTTP::SendJSON(server, req.Cookies());
			}
			else if (api == "headers")
			{
				HTTP::SendJSON(server, req.Headers());
			}
			else if (api == "echo")
			{
				HTTP::SendJSON(server, req.Params());
			}
			else if (api == "meta")
			{
				stringstream s; s << ++count;
				map<string,string> m;
				m["request_number"] = s.str();
				HTTP::SendJSON(server, m);
			}
			//else if (api == "file")
			//{
			//	HTTP::SendFile(server, req.SplitPath().back());
			//}
			else
			{
				Debug("Sending file...");
				HTTP::SendFile(server, req.Path());
				Debug("Sent file");
			}
			server.Close();
			server.Listen();
			Debug("Finished request.");
		}
	}
}

