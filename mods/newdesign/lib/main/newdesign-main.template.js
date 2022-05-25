module.exports = (app) => {

  return `

    <div class="container" id="container">
    <h3>h3 - Module header</h3>

    <button class="main">Main*</button>
  
    <p>Form Items</p>
    <div>
        <div>Title</div>
        <div>This is a row of plain text.<div>
        <div>Password</div>
        <div><input id="password" type="password" value="This is a password field" class="password" /></div>
        <div>Text Input</div>
        <div><input type="text" value="This is a text field."></input></div>
        <div>Date Input</div>
        <div><input type="date" value="2022-05-25"></input></div>
        <div>Range Input</div>
        <div><input type="range" value="8"></input></div>
        <div>Checkboxes</div>
        <div><input type="checkbox" checked></input><input type="checkbox"></input><input type="checkbox"></input><input type="checkbox"></input></div>
        <div>Radio Buttons</div>
        <div><input type="radio" checked></input><input type="radio"></input><input type="radio"></input><input type="radio"></input></div>
        <div>Select</div>
        <div>
          <select>
          <option>One</option>
          <option>Two</option>
          <option>Three</option>
          <option>Last of Many</option>
        </div>
  
  
  <hr/>
   
  <button>Standard</button>  

  <button>Big</button>  

  <button>Small</button>  
 
  <button>Standard Alt</button>  

  <button>Big Alt</button>  

  <button>Small Alt</button>  

  <p>Text Area</p>
  <textarea>
      Bacon ipsum dolor amet meatloaf ribeye pork loin corned beef strip steak filet mignon shank chicken shankle cupim hamburger bacon kielbasa biltong. Alcatra pork belly ball tip kielbasa t-bone drumstick turducken, boudin porchetta landjaeger. Short ribs chuck frankfurter pork belly spare ribs meatloaf. Pig tri-tip meatloaf picanha, sirloin strip steak shoulder cow porchetta pork chop filet mignon swine burgdoggen bacon.
  </textarea>
  
  <p>Pre</p>
  <pre>
      {
          "bf": 1,
          "coinbase": "478016666.66666667",
          "creator": "z1UA26VVMkAKudvDVm9BseGGtq1bfdWz2msp4mMwjRPX",
          "difficulty": 0,
          "id": 2,
          "merkle": "",
          "paysplit": 0.5,
          "powsplit": 0.5,
          "prevbsh": "cb7cdd9633bf67cd3eff12266eb462018f239a78b666059ea3e7088c3f355b04",
          "reclaimed": "0.0",
          "sr": 0,
          "stakepool": "0",
          "treasury": "2390083333.33333333",
          "ts": 1572407380711
          }
  </pre>
  
  <p>Fieldset></p>
  <fieldset>
      <h1>h1 Heading</h1>
      <h2>h2 Heading</h2>
      <h3>h3 Heading - Module and Page Title</h3>
      <h4>h4 Sub Heading</h4>
      <h5>h4 Sub Heading</h5>
      <h6>h4 Sub Heading</h4>    
      <p>Bacon ipsum dolor amet meatloaf ribeye pork loin corned beef strip steak filet mignon shank chicken shankle cupim hamburger bacon kielbasa biltong. Alcatra pork belly ball tip kielbasa t-bone drumstick turducken, boudin porchetta landjaeger. Short ribs chuck frankfurter pork belly spare ribs meatloaf. Pig tri-tip meatloaf picanha, sirloin strip steak shoulder cow porchetta pork chop filet mignon swine burgdoggen bacon.
  
      </p>    
  </fieldset>
  
  <hr>
  </div>

  `;

}

