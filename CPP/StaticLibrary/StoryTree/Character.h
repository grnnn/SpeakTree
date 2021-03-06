//Character.h
#ifndef Character_H
#define Character_H

#include "stdafx.h"

#include "Characteristic.h"
#include "MemoryBank.h"
#include "ActionTree.h"

#include <string>
#include <unordered_map>

class Character
{
public:
	Character();
	Character(std::string name);
	~Character();

	std::string																					getName();

	void																						addCharacteristic(const ST::Characteristic& characteristic);
	void																						parseExpression(std::string cls, std::string type, std::string operation, int value);
	void																						parseExpression(std::string cls, std::string type, std::string operation, bool value);
	void																						addAction(int uid, const ST::Action& action);

private:
	std::string																					name;

	std::unordered_map<std::string, std::unordered_map<std::string, ST::Characteristic>>		characteristics;

	MemoryBank																					memoryBank;

	ActionTree																					actionTree;
};

#endif