#include <foxbox/websocket.h>
#include <iostream>
#include <sstream>
#include <thread>
#include <mutex>
#include <map>

#include "game.hpp"

using namespace std;
using namespace Foxbox;



bool g_running = true;
int Serve(int port, int id)
{
	WS::Server player(port);
	WS::Server stalker(port);
	while (g_running)
	{
		Debug("Wait for player...");
		player.Listen();
		
		Debug("Found player!");
		player.Send("PLAYER\n");
		
		Debug("Wait for stalker...");
		do
		{
			stalker.Listen();
			if (!stalker.Valid())
			{
				Warn("Invalid connection attempt");
				HTTP::SendPlain(stalker.TCP(), 400, "This is a WebSocket server");
				stalker.Close();
				continue;
			}
		}
		while (!stalker.Valid());
		Debug("Found stalker!");
		stalker.Send("STALKER");
		
		while (player.CanReceive(-1) && stalker.CanSend(-1))
		{
			string buffer;
			player.GetToken(buffer);
			stalker.Send(buffer);
		}
		if (player.Valid()) player.Close();
		if (stalker.Valid()) stalker.Close();
	}
	return 0;
}

#define POOL_SIZE 1
int main(int argc, char ** argv)
{
	int port = (argc == 2) ? atoi(argv[1]) : 7681;
	
	while (g_running)
	{
		Game game(port, 2);
		game.Play();
	}
	
}
