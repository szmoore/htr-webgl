#include "game.hpp"

using namespace std;
using namespace Foxbox;

Game::Game(int port, unsigned players) : m_players(players, NULL), m_controller(NULL)
{
	for (unsigned i = 0; i < players; ++i)
	{
		WS::Server * ws = new WS::Server(port);
		m_players[i] = (Socket*)ws; // down cast
		do
		{
			ws->Listen();
			if (!ws->Valid())
			{
				Warn("Invalid connection attempt, player %u", i);
				HTTP::SendPlain(ws->TCP(), 400, "This is a WebSocket server");
				ws->TCP().Close();
				continue;
			}
			ws->Send("MULTIPLAYER %u %u\n", i, players);
			Debug("Player %d connected from %s", i, ws->TCP().RemoteAddress().c_str());
			
		} while (!ws->Valid());
	}
	m_controller = (Socket*)&Stdio;
	
	if (m_controller != NULL)
		m_players.push_back(m_controller);
}

Game::~Game()
{
	for (unsigned i = 0; i < m_players.size() - (m_controller != NULL); ++i)
	{
		
		m_players[i]->Close();
		delete m_players[i];
	}
}


void Game::Play()
{
	Socket * input = NULL;
	do
	{
		input = Socket::Select(m_players, NULL, 30);
		unsigned index = 0;
		for (index = 0; index < m_players.size(); ++index)
		{
			if ((Socket*)m_players[index] == input)
				break;
		}
		if (index >= m_players.size())
			Fatal("Got message from Socket that isn't a player!@?");
		
		string message;
		input->GetToken(message, "\n");
		if (message.size() == 0)
			continue;
		Debug("Got message \"%s\" from player %u", message.c_str(), index);
		for (unsigned i = 0; i < m_players.size(); ++i)
		{
			m_players[i]->Send("%u %s\n", index, message.c_str());
		}
	}
	while (input != NULL);
	Debug("Received no input from any player for 30s");
}
