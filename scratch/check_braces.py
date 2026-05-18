
import sys

def count_braces(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    braces = 0
    parens = 0
    brackets = 0
    backticks = 0
    
    for row, line in enumerate(lines):
        for col, char in enumerate(line):
            if char == '{': braces += 1
            elif char == '}': braces -= 1
            elif char == '(': parens += 1
            elif char == ')': parens -= 1
            elif char == '[': brackets += 1
            elif char == ']': brackets -= 1
            elif char == '`': backticks += 1
            
            if braces < 0:
                print(f"Brace unbalanced at line {row+1}, col {col+1}")
                braces = 0
            if parens < 0:
                print(f"Paren unbalanced at line {row+1}, col {col+1}")
                parens = 0
            if brackets < 0:
                print(f"Bracket unbalanced at line {row+1}, col {col+1}")
                brackets = 0
    
    print(f"Final counts: Braces={braces}, Parens={parens}, Brackets={brackets}, Backticks={backticks}")

count_braces(sys.argv[1])
