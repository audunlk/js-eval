
import * as vscode from 'vscode';
import * as vm from 'vm';



export function activate(context: vscode.ExtensionContext) {
  
	let disposable = vscode.commands.registerCommand('js-eval.js-eval', () => {
	
      let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 300);
    function updateStatusBar() {
      let editor = vscode.window.activeTextEditor;
      if (!editor) {
        statusBarItem.hide();
        return;
      }
      //get the current document
      const document = editor.document;

      // Use the document to get the text of the file
      //get text from start of document, to start of selection
      const text = document.getText(new vscode.Range(new vscode.Position(0, 0), editor.selection.start));

      //split the text into lines
      const lines = text.split('\n');

      //get the selected text
      const selection = editor.selection;

      //get the selected text
      let selectedText = document.getText(selection);

      //initialize an empty map to store the variables and their values
      const variables = new Map<string, string>();
      //Alternative? const variables = new Map<string, {value: string, unique: boolean}>();

      
      //make an array with all the selected text variables.
      let selectedTextMatch = selectedText.match(/[a-zA-Z]+/g);

      if (selectedTextMatch) {
        //in order to ignore the rest of the line when an inline selection is requesting evaluation:
        let lineLength = lines.length - 1;
        console.log(`selectedTextMatch: ${selectedTextMatch}`);
        for (let j = 0; j < selectedTextMatch.length; j++) {
          console.log(`selectedTextMatch in the loop: ${selectedTextMatch[j]}`);
          for (let i = 0; i < lineLength; i++) {
            console.log(selectedTextMatch);
            //use a regular expression to match the variable declarations
            const line = lines[i];
            const match = line.match(/^\s*(let|const|var)\s+(\w+)\s*=\s*([^;]+)/);
            const reDeclareMatch = line.match(/^\s*(\w+)\s*=\s*([^;]+)/);

            if (match) {
              //extract the variable name and value
              const [, , name, value] = match;
               //replace the variable names in the value with their corresponding values
              let modifiedValue = value;
              variables.forEach((val, varName) => {
                modifiedValue = modifiedValue.replace(new RegExp(varName, "g"), val);
              });
            //Add the variable to the map, replacing any existing value
              variables.set(name, modifiedValue);
            }else if(reDeclareMatch){
              const [, name, value] = reDeclareMatch;
              //replace the variable names in the value with their corresponding values
              let modifiedValue = value;
              variables.forEach((val, varName) => {
                modifiedValue = modifiedValue.replace(new RegExp(varName, "g"), val);
              });
              variables.set(name, modifiedValue);
            }
          }
        }
      }

      
      //Log all the variables in the map
      console.log(`Found variables: ${JSON.stringify([...variables])}`);

      //replace the variables in the selected text with their values
      let modifiedText = selectedText;
      for (const [name, value] of variables) {
        let modifiedTextMatch = modifiedText.match(/\b[a-zA-Z]+\b/g);
        if(modifiedTextMatch){
          for(let i = 0; i < modifiedTextMatch.length; i++){
            if(modifiedTextMatch[i] === name){
              modifiedText = modifiedText.replace(new RegExp(name, 'g'), value);
              console.log(`modification successful`);
            }
          }
        }
      }
      console.log(`Modified text: ${modifiedText}`);

      //evaluate the modified text
      let result;
      try {
        let modifiedTextFilter = modifiedText.match(/[\[\]\{\}]/g);
        if(selectedText === ''){
          result = 'Select code to evaluate';
          statusBarItem.text = `${result}`;
          statusBarItem.show();
        }else if(modifiedTextFilter){
          result = 'Please select variables that are not arrays, objects, or functions';
          statusBarItem.text = `${result}`;
          statusBarItem.show();
        }else{
          //Result should be sandbox value of modified text.
          result = vm.runInNewContext(modifiedText,
            // sandbox,
            );
          //result = vm.runInNewContext(result);
          statusBarItem.text = `Result: ${result}`;
          statusBarItem.show();
        }
      } catch (e) {
        result = (e as Error).message;
        statusBarItem.text = `Result: ${result}`;
        statusBarItem.show();
      }
    }

    // gget the active text editor
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      updateStatusBar();
      
    }

    //subscribe to the oncChange event to update the status bar when the selection changes
    let selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
      updateStatusBar();
    });

    context.subscriptions.push(selectionChangeDisposable);
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }